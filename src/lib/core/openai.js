"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOpenAIClient = createOpenAIClient;
const openai_1 = __importDefault(require("openai"));
function createOpenAIClient(config) {
    return new openai_1.default({
        apiKey: config?.apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
        baseURL: config?.baseURL || process.env.NEXT_PUBLIC_BASE_URL || process.env.OPENAI_BASE_URL
    });
}
//# sourceMappingURL=openai.js.map