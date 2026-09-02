import { registerPlugin } from '@capacitor/core';
import { chatService } from './chatService';
import { tokenUtils } from '../utils/tokenUtils';
import { logger } from '../utils/logger';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mylokalni.pl/api';
const CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB

interface VideoUploadPlugin {
    initUpload(opts: { uploadId: string; filename: string; mimeType: string }): Promise<void>;
    appendChunk(opts: { uploadId: string; data: string }): Promise<void>;
    performUpload(opts: { uploadId: string; token: string; apiUrl: string }): Promise<{ url: string }>;
    cancelUpload(opts: { uploadId: string }): Promise<void>;
}

const NativeVideoUpload = registerPlugin<VideoUploadPlugin>('VideoUpload');

type DoneCb = () => void;
type ErrorCb = (msg: string) => void;

interface UploadEntry {
    chatId: string;
    onDone: Set<DoneCb>;
    onError: Set<ErrorCb>;
}

const active = new Map<string, UploadEntry>();

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function startVideoUpload(
    chatId: string,
    text: string | undefined,
    file: File,
    invalidate: () => void,
    onDone: DoneCb,
    onError: ErrorCb,
): { uploadId: string; cancel: () => void } {
    const uploadId = `v-${Date.now()}`;
    let cancelled = false;

    active.set(uploadId, { chatId, onDone: new Set([onDone]), onError: new Set([onError]) });

    (async () => {
        try {
            logger.debug(`[video] start upload chatId=${chatId} size=${file.size} type=${file.type}`);

            await NativeVideoUpload.initUpload({
                uploadId,
                filename: file.name || 'video.mp4',
                mimeType: file.type || 'video/mp4',
            });

            let offset = 0;
            while (offset < file.size) {
                if (cancelled) throw new Error('Upload anulowany.');
                const slice = file.slice(offset, offset + CHUNK_SIZE);
                const buffer = await slice.arrayBuffer();
                await NativeVideoUpload.appendChunk({ uploadId, data: arrayBufferToBase64(buffer) });
                offset += buffer.byteLength;
                logger.debug(`[video] chunk ${offset}/${file.size}`);
            }

            if (cancelled) throw new Error('Upload anulowany.');

            logger.debug(`[video] performUpload start`);
            const token = tokenUtils.get();
            if (!token) throw new Error('Brak tokenu autoryzacji — zaloguj się ponownie.');
            const result = await NativeVideoUpload.performUpload({
                uploadId,
                token,
                apiUrl: API_URL,
            });

            logger.debug(`[video] upload OK url=${result.url}`);
            await chatService.sendMessage(chatId, text, undefined, result.url);
            logger.debug(`[video] sendMessage OK`);
            invalidate();
            active.get(uploadId)?.onDone.forEach(cb => cb());
        } catch (err: unknown) {
            logger.error(`[video] FAILED: ${(err as Error)?.message}`, err);
            if (!cancelled) {
                NativeVideoUpload.cancelUpload({ uploadId }).catch(() => {});
                active.get(uploadId)?.onError.forEach(cb => cb((err as Error)?.message ?? 'Błąd wysyłania wideo.'));
            }
        } finally {
            active.delete(uploadId);
        }
    })();

    return {
        uploadId,
        cancel() {
            cancelled = true;
            NativeVideoUpload.cancelUpload({ uploadId }).catch(() => {});
            active.delete(uploadId);
        },
    };
}

export function isUploadActive(uploadId: string): boolean {
    return active.has(uploadId);
}
