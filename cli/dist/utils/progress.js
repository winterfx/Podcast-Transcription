"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressReporter = void 0;
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
class ProgressReporter {
    constructor(quiet = false) {
        this.quiet = quiet;
        this.spinner = quiet ? null : (0, ora_1.default)();
    }
    start(message) {
        this.spinner?.start(message);
    }
    update(message) {
        if (this.spinner) {
            this.spinner.text = message;
        }
    }
    succeed(message) {
        this.spinner?.succeed(message);
    }
    fail(message) {
        this.spinner?.fail(message);
    }
    info(message) {
        if (!this.quiet) {
            console.log(chalk_1.default.blue('i'), message);
        }
    }
    warn(message) {
        if (!this.quiet) {
            console.log(chalk_1.default.yellow('!'), message);
        }
    }
    progressBar(current, total, label = '') {
        if (this.quiet)
            return;
        const percentage = Math.round((current / total) * 100);
        const filled = Math.round(percentage / 5);
        const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(20 - filled);
        this.update(`${label} [${bar}] ${percentage}% (${current}/${total})`);
    }
}
exports.ProgressReporter = ProgressReporter;
//# sourceMappingURL=progress.js.map