"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribeCommand = transcribeCommand;
const fs_1 = require("fs");
const path_1 = require("path");
const chalk_1 = __importDefault(require("chalk"));
const progress_1 = require("../utils/progress");
// Import from core modules using relative paths
const transcription_1 = require("../../../src/lib/core/transcription");
const summary_1 = require("../../../src/lib/core/summary");
const audio_downloader_1 = require("../../../src/lib/core/audio-downloader");
const audio_1 = require("../../../src/lib/audio");
function isUrl(input) {
    return input.startsWith('http://') || input.startsWith('https://');
}
function formatOutput(transcript, summary, format) {
    switch (format) {
        case 'json':
            return JSON.stringify({ transcript, summary: summary || undefined }, null, 2);
        case 'markdown':
            let md = `# Transcription\n\n${transcript}`;
            if (summary) {
                md += `\n\n---\n\n# Summary\n\n${summary}`;
            }
            return md;
        default:
            let text = transcript;
            if (summary) {
                text += `\n\n========== SUMMARY ==========\n\n${summary}`;
            }
            return text;
    }
}
async function transcribeCommand(input, options) {
    const progress = new progress_1.ProgressReporter(options.quiet);
    try {
        let audioBuffer;
        let mimeType;
        // Determine input type
        if (isUrl(input)) {
            progress.start('Downloading audio...');
            const result = await (0, audio_downloader_1.downloadAudio)(input);
            audioBuffer = result.buffer;
            mimeType = result.mimeType;
            progress.succeed('Audio downloaded');
        }
        else {
            // Local file
            const filePath = (0, path_1.resolve)(input);
            if (!(0, fs_1.existsSync)(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }
            progress.start('Reading audio file...');
            audioBuffer = (0, fs_1.readFileSync)(filePath);
            const ext = (0, path_1.extname)(filePath).slice(1).toLowerCase();
            mimeType = (0, audio_1.getMimeTypeFromExtension)(ext);
            progress.succeed('Audio file loaded');
        }
        // Transcribe
        progress.start('Transcribing audio...');
        const partialTranscripts = [];
        const transcript = await (0, transcription_1.transcribeAudio)(audioBuffer, mimeType, {
            language: options.language,
            onProgress: (progressData) => {
                if (progressData.type === 'progress') {
                    progress.update(progressData.message || 'Processing...');
                }
                else if (progressData.type === 'partial' && progressData.progress) {
                    partialTranscripts[progressData.progress.current - 1] = progressData.transcript || '';
                    progress.progressBar(progressData.progress.current, progressData.progress.total, 'Transcribing');
                }
            }
        });
        progress.succeed('Transcription complete');
        // Generate summary if requested
        let summary = null;
        if (options.summary) {
            progress.start('Generating AI summary...');
            summary = await (0, summary_1.generateSummary)(transcript, {
                language: options.language
            });
            progress.succeed('Summary generated');
        }
        // Format output
        const output = formatOutput(transcript, summary, options.outputFormat);
        // Write output
        if (options.output) {
            (0, fs_1.writeFileSync)(options.output, output, 'utf-8');
            console.log(chalk_1.default.green(`\nOutput saved to: ${options.output}`));
        }
        else {
            console.log('\n' + output);
        }
    }
    catch (error) {
        progress.fail('Operation failed');
        console.error(chalk_1.default.red(`\nError: ${error instanceof Error ? error.message : 'Unknown error'}`));
        process.exit(1);
    }
}
//# sourceMappingURL=transcribe.js.map