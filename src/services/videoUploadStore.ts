import { tokenUtils } from '../utils/tokenUtils'
import { chatService } from './chatService'

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mylokalni.pl/api'

// ── Shared state ──────────────────────────────────────────────────────────────
let _state: VideoUploadState | null = null
let _xhr: XMLHttpRequest | null = null
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

    runXhrUpload(sessionId, tempId, file, text)
}

// ── XHR upload ────────────────────────────────────────────────────────────────
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
