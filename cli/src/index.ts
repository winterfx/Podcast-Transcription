#!/usr/bin/env node
import { Command } from 'commander';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { homedir } from 'os';
import { transcribeCommand, TranscribeOptions } from './commands/transcribe';

// Load environment variables from multiple locations (first found wins)
// 1. Current working directory
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });
// 2. User home directory ~/.pt/.env
dotenv.config({ path: resolve(homedir(), '.pt', '.env') });
// 3. User config directory ~/.config/pt/.env
dotenv.config({ path: resolve(homedir(), '.config', 'pt', '.env') });

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
