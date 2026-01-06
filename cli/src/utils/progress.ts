import ora, { Ora } from 'ora';
import chalk from 'chalk';

export class ProgressReporter {
  private spinner: Ora | null;
  private quiet: boolean;

  constructor(quiet: boolean = false) {
    this.quiet = quiet;
    this.spinner = quiet ? null : ora();
  }

  start(message: string): void {
    this.spinner?.start(message);
  }

  update(message: string): void {
    if (this.spinner) {
      this.spinner.text = message;
    }
  }

  succeed(message: string): void {
    this.spinner?.succeed(message);
  }

  fail(message: string): void {
    this.spinner?.fail(message);
  }

  info(message: string): void {
    if (!this.quiet) {
      console.log(chalk.blue('i'), message);
    }
  }

  warn(message: string): void {
    if (!this.quiet) {
      console.log(chalk.yellow('!'), message);
    }
  }

  progressBar(current: number, total: number, label: string = ''): void {
    if (this.quiet) return;

    const percentage = Math.round((current / total) * 100);
    const filled = Math.round(percentage / 5);
    const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(20 - filled);
    this.update(`${label} [${bar}] ${percentage}% (${current}/${total})`);
  }
}
