export interface DownloadResult {
    buffer: Buffer;
    mimeType: string;
    extension: string;
}
export declare function downloadAudio(url: string): Promise<DownloadResult>;
