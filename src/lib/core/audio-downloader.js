"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadAudio = downloadAudio;
const utils_1 = require("@/lib/utils");
const audio_1 = require("@/lib/audio");
async function downloadAudio(url) {
    utils_1.logger.info('[AudioDownloader] Downloading audio from URL:', url);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`);
    }
    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extension = (0, audio_1.getExtensionFromMimeType)(contentType);
    utils_1.logger.info('[AudioDownloader] Downloaded audio:', {
        size: buffer.length,
        contentType,
        extension
    });
    return {
        buffer,
        mimeType: contentType,
        extension
    };
}
//# sourceMappingURL=audio-downloader.js.map