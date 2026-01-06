import { existsSync } from 'fs';
import { stat, writeFile } from 'fs/promises';
import { resolve } from 'path';
import chalk from 'chalk';
import { ProgressReporter } from '../utils/progress';

// Import from core modules using relative paths
import { transcribeAudio, transcribeAudioFile, TranscriptionProgress } from '../../../src/lib/core/transcription';
import { generateSummary } from '../../../src/lib/core/summary';
import { downloadAudio } from '../../../src/lib/core/audio-downloader';

export interface TranscribeOptions {
  summary: boolean;
  language: string;
  output?: string;
  outputFormat: 'text' | 'json' | 'markdown' | 'srt';
  quiet: boolean;
}

function isUrl(input: string): boolean {
  return input.startsWith('http://') || input.startsWith('https://');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatOutput(transcript: string, summary: string | null, format: string, srt?: string): string {
  switch (format) {
    case 'srt':
      return srt || '';
    case 'json':
      return JSON.stringify(
        { transcript, summary: summary || undefined, srt: srt || undefined },
        null,
        2
      );
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

export async function transcribeCommand(
  input: string,
  options: TranscribeOptions
): Promise<void> {
  const progress = new ProgressReporter(options.quiet);
  const needSrt = options.outputFormat === 'srt';

  try {
    let transcript: string;
    let srt: string | undefined;

    const progressCallback = (progressData: TranscriptionProgress) => {
      if (progressData.type === 'progress') {
        progress.update(progressData.message || 'Processing...');
      } else if (progressData.type === 'partial' && progressData.progress) {
        progress.progressBar(
          progressData.progress.current,
          progressData.progress.total,
          'Transcribing'
        );
      }
    };

    // Determine input type
    if (isUrl(input)) {
      // URL: need to download to buffer first
      progress.start('Downloading audio...');
      const downloadResult = await downloadAudio(input);
      progress.succeed(`Audio downloaded (${formatBytes(downloadResult.buffer.length)})`);

      progress.start('Transcribing audio...');
      const transcribeResult = await transcribeAudio(downloadResult.buffer, downloadResult.extension, {
        language: options.language,
        outputFormat: needSrt ? 'srt' : 'text',
        onProgress: progressCallback
      });
      transcript = transcribeResult.text;
      srt = transcribeResult.srt;
    } else {
      // Local file: use file path directly (no memory copy)
      const filePath = resolve(input);
      if (!existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileStats = await stat(filePath);

      progress.info(`File: ${filePath} (${formatBytes(fileStats.size)})`);
      progress.start('Transcribing audio...');

      const transcribeResult = await transcribeAudioFile(filePath, {
        language: options.language,
        outputFormat: needSrt ? 'srt' : 'text',
        onProgress: progressCallback
      });
      transcript = transcribeResult.text;
      srt = transcribeResult.srt;
    }

    progress.succeed('Transcription complete');

    // Generate summary if requested (not available for SRT format)
    let summary: string | null = null;
    if (options.summary && !needSrt) {
      progress.start('Generating AI summary...');
      summary = await generateSummary(transcript, {
        language: options.language
      });
      progress.succeed('Summary generated');
    }

    // Format output
    const output = formatOutput(transcript, summary, options.outputFormat, srt);

    // Write output
    if (options.output) {
      await writeFile(options.output, output, 'utf-8');
      console.log(chalk.green(`\nOutput saved to: ${options.output}`));
    } else {
      console.log('\n' + output);
    }

  } catch (error) {
    progress.fail('Operation failed');
    console.error(
      chalk.red(`\nError: ${error instanceof Error ? error.message : 'Unknown error'}`)
    );
    process.exit(1);
  }
}
