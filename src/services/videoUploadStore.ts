import { Capacitor, registerPlugin } from '@capacitor/core'
import { tokenUtils } from '../utils/tokenUtils'
import { chatService } from './chatService'
import { logger } from '../utils/logger'

export type VideoUploadStatus = 'uploading' | 'done' | 'error'

export interface VideoUploadState {
    status: VideoUploadStatus
    sessionId: string
    tempId: string
    progress: number
    url?: string
    error?: string
    text?: string
}

// ── Native plugin (iOS / Android) ────────────────────────────────────────────
interface VideoUploadPlugin {
    initUpload(opts: { uploadId: string; filename: string; mimeType: string }): Promise<void>
    appendChunk(opts: { uploadId: string; data: string }): Promise<void>
    performUpload(opts: { uploadId: string; token: string; apiUrl: string }): Promise<{ url: string }>
    cancelUpload(opts: { uploadId: string }): Promise<void>
}

const NativeVideoUpload = Capacitor.isNativePlatform()
    ? registerPlugin<VideoUploadPlugin>('VideoUpload')
    : null

const CHUNK_SIZE = 2 * 1024 * 1024 // 2 MB
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mylokalni.pl/api'

// ── Shared state ──────────────────────────────────────────────────────────────
let _state: VideoUploadState | null = null
let _xhr: XMLHttpRequest | null = null
let _nativeId: string | null = null
let _cancelled = false
let _onSent: ((url: string) => void) | null = null

export function getVideoUploadState(): VideoUploadState | null {
    return _state
}

function dispatch(next: VideoUploadState) {
    _state = next
    window.dispatchEvent(new CustomEvent('videoUpload:state', { detail: next }))
}

function abortCurrent() {
    _cancelled = true
    if (_xhr) { _xhr.abort(); _xhr = null }
    if (_nativeId) {
        NativeVideoUpload?.cancelUpload({ uploadId: _nativeId }).catch(() => void 0)
        _nativeId = null
    }
}

// ── Entry point — publiczne API (niezmienione) ────────────────────────────────
export function startVideoUpload(
    sessionId: string,
    tempId: string,
    file: File,
    text?: string,
    onSent?: (url: string) => void,
) {
    abortCurrent()
    _cancelled = false
    _onSent = onSent ?? null

    if (NativeVideoUpload) {
        runNativeUpload(sessionId, tempId, file, text)
    } else {
        runXhrUpload(sessionId, tempId, file, text)
    }
}

// ── Natywny chunked upload (iOS / Android) ────────────────────────────────────
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
    return btoa(binary)
}

async function runNativeUpload(sessionId: string, tempId: string, file: File, text?: string) {
    const uploadId = `v-${Date.now()}`
    _nativeId = uploadId

    dispatch({ status: 'uploading', sessionId, tempId, progress: 0, text })

    try {
        await NativeVideoUpload!.initUpload({
            uploadId,
            filename: file.name || 'video.mp4',
            mimeType: file.type || 'video/mp4',
        })

        let offset = 0
        while (offset < file.size) {
            if (_cancelled) throw new Error('Upload anulowany.')
            const slice = file.slice(offset, offset + CHUNK_SIZE)
            const buffer = await slice.arrayBuffer()
            await NativeVideoUpload!.appendChunk({ uploadId, data: arrayBufferToBase64(buffer) })
            offset += buffer.byteLength
            // Progress 0–80% podczas przesyłania chunków, 80–100% podczas przetwarzania serwera
            if (_state?.status === 'uploading') {
                dispatch({ ..._state, progress: Math.round((offset / file.size) * 80) })
            }
        }

        if (_cancelled) throw new Error('Upload anulowany.')

        const token = tokenUtils.get()
        if (!token) throw new Error('Brak tokenu — zaloguj się ponownie.')

        if (_state?.status === 'uploading') dispatch({ ..._state, progress: 85 })

        const result = await NativeVideoUpload!.performUpload({ uploadId, token, apiUrl: API_URL })
        _nativeId = null

        dispatch({ status: 'done', sessionId, tempId, progress: 100, url: result.url, text })

        await chatService.sendMessage(sessionId, text || undefined, undefined, result.url)
        _onSent?.(result.url)
    } catch (err: unknown) {
        if (!_cancelled) {
            const msg = err instanceof Error ? err.message : 'Błąd wysyłania wideo'
            logger.error('[videoUpload] native FAILED:', msg)
            NativeVideoUpload?.cancelUpload({ uploadId }).catch(() => void 0)
            dispatch({ status: 'error', sessionId, tempId, progress: 0, error: msg, text })
        }
    } finally {
        _nativeId = null
        _state = null
        _onSent = null
    }
}

// ── XHR upload (web) ──────────────────────────────────────────────────────────
function runXhrUpload(sessionId: string, tempId: string, file: File, text?: string) {
    const token = tokenUtils.get()
    const xhr = new XMLHttpRequest()
    _xhr = xhr

    dispatch({ status: 'uploading', sessionId, tempId, progress: 0, text })

    xhr.open('POST', `${API_URL}/upload/video`)
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.withCredentials = true

    xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && _state?.status === 'uploading') {
            dispatch({ ..._state, progress: Math.round((e.loaded / e.total) * 100) })
        }
    }

    xhr.onload = () => {
        _xhr = null
        if (xhr.status >= 200 && xhr.status < 300) {
            let url: string | undefined
            let thumbnailUrl: string | undefined
            try {
                const parsed = JSON.parse(xhr.responseText)
                url = parsed?.url
                thumbnailUrl = parsed?.thumbnailUrl ?? undefined
            } catch { /* not JSON */ }

            if (url) {
                dispatch({ status: 'done', sessionId, tempId, progress: 100, url, text })
                chatService.sendMessage(sessionId, text || undefined, undefined, url, undefined, thumbnailUrl)
                    .then(() => { _onSent?.(url!) })
                    .catch((err: Error) => {
                        dispatch({ status: 'error', sessionId, tempId, progress: 0, error: err?.message ?? 'Błąd wysyłania wideo', text })
                    })
                    .finally(() => { _state = null })
            } else {
                dispatch({ status: 'error', sessionId, tempId, progress: 0, error: 'Błąd przesyłania wideo', text })
            }
        } else {
            let msg = `Błąd przesyłania (${xhr.status})`
            try { const b = JSON.parse(xhr.responseText); if (b.message) msg = b.message } catch { /* not JSON */ }
            dispatch({ status: 'error', sessionId, tempId, progress: 0, error: msg, text })
        }
    }

    xhr.onerror = () => {
        _xhr = null
        dispatch({ status: 'error', sessionId, tempId, progress: 0, error: 'Błąd połączenia podczas przesyłania', text })
    }

    const fd = new FormData()
    fd.append('file', file)
    xhr.send(fd)
}

export function cancelVideoUpload() {
    abortCurrent()
    _state = null
    _onSent = null
}

export function clearVideoUploadState() {
    _state = null
    _onSent = null
}
