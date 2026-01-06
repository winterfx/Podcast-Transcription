#!/usr/bin/env node
import { Command } from 'commander';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { transcribeCommand, TranscribeOptions } from './commands/transcribe';

// Load environment variables from project root
dotenv.config({ path: resolve(__dirname, '../../.env.local') });
dotenv.config({ path: resolve(__dirname, '../../.env') });

const program = new Command();

program
  .name('pt')
  .description('CLI tool for podcast transcription with AI summary')
  .version('1.0.0');

program
  .argument('[input]', 'Local file path or direct audio URL')
  .option('-s, --summary', 'Generate AI summary after transcription', false)
  .option('--no-summary', 'Disable AI summary generation')
  .option('-l, --language <lang>', 'Language code (auto, en, zh, etc.)', 'auto')
  .option('-o, --output <file>', 'Output file path (stdout if not specified)')
  .option('--output-format <format>', 'Output format: text, json, markdown, srt', 'text')
  .option('-q, --quiet', 'Suppress progress output', false)
  .action((input: string | undefined, options: TranscribeOptions) => {
    if (!input) {
      program.help();
    } else {
      transcribeCommand(input, options);
    }
  });

program.parse();
