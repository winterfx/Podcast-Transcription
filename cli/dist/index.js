#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = require("path");
const transcribe_1 = require("./commands/transcribe");
// Load environment variables from project root
dotenv_1.default.config({ path: (0, path_1.resolve)(__dirname, '../../.env.local') });
dotenv_1.default.config({ path: (0, path_1.resolve)(__dirname, '../../.env') });
const program = new commander_1.Command();
program
    .name('podcast-transcribe')
    .description('CLI tool for podcast transcription with AI summary')
    .version('1.0.0');
program
    .argument('<input>', 'Local file path or direct audio URL')
    .option('-s, --summary', 'Generate AI summary after transcription', false)
    .option('--no-summary', 'Disable AI summary generation')
    .option('-l, --language <lang>', 'Language code (auto, en, zh, etc.)', 'auto')
    .option('-o, --output <file>', 'Output file path (stdout if not specified)')
    .option('--output-format <format>', 'Output format: text, json, markdown', 'text')
    .option('-q, --quiet', 'Suppress progress output', false)
    .action((input, options) => {
    (0, transcribe_1.transcribeCommand)(input, options);
});
program.parse();
//# sourceMappingURL=index.js.map