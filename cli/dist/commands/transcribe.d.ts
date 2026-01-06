export interface TranscribeOptions {
    summary: boolean;
    language: string;
    output?: string;
    outputFormat: 'text' | 'json' | 'markdown';
    quiet: boolean;
}
export declare function transcribeCommand(input: string, options: TranscribeOptions): Promise<void>;
