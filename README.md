# Podcast Transcription App

[English](#english) | [中文](#chinese)

<h2 id="english">English</h2>

A podcast transcription application based on Next.js and OpenAI Whisper API, supporting audio file transcription and intelligent summary generation.

## ✨ Features

- 🎯 Support both file upload and URL input
- 🎙️ Support for Xiaoyuzhou podcast link parsing
- 📝 High-quality audio transcription using OpenAI Whisper API
- 📊 AI-powered content summarization
- 🎨 Modern UI design
- 💾 Download transcripts and summaries
- 🎵 Built-in audio player

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- OpenAI API Key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/podcast-transcription.git
cd podcast-transcription
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Configure environment variables:
Create a `.env.local` file and add:
```env
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_BASE_URL=your_endpoint
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the app.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **API**: [OpenAI Whisper](https://platform.openai.com/docs/guides/speech-to-text)
- **Type Safety**: [TypeScript](https://www.typescriptlang.org/)

## 📝 Usage

1. **File Upload**:
   - Click the "File Upload" tab
   - Select a local audio file
   - Click "Transcribe" to start

2. **URL Input**:
   - Click the "URL Input" tab
   - Enter a podcast link (supports Xiaoyuzhou podcast)
   - Click "Transcribe" to start

3. **View Results**:
   - View detailed transcription after processing
   - Get AI-generated summary
   - Download transcripts and summaries using the download buttons

## 🤝 Contributing

Pull Requests and Issues are welcome!

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

---

<h2 id="chinese">中文</h2>

一个基于 Next.js 和 OpenAI Whisper API 的播客转录应用，支持音频文件转录和智能摘要生成。

## 🌟 特性

- 🎯 支持音频文件上传和 URL 输入两种方式
- 🎙️ 支持小宇宙播客链接解析
- 📝 使用 OpenAI Whisper API 进行高质量音频转录
- 📊 AI 驱动的内容摘要生成
- 🎨 现代化的 UI 设计
- 💾 支持转录文本和摘要的下载
- 🎵 内置音频播放器

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- OpenAI API Key

### 安装

1. 克隆仓库：
```bash
git clone https://github.com/yourusername/podcast-transcription.git
cd podcast-transcription
```

2. 安装依赖：
```bash
npm install
# 或
yarn install
# 或
pnpm install
```

3. 配置环境变量：
创建 `.env.local` 文件并添加以下内容：
```env
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_BASE_URL=your_endpoint
```

4. 启动开发服务器：
```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 🛠️ 技术栈

- **Framework**: [Next.js 14](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **API**: [OpenAI Whisper](https://platform.openai.com/docs/guides/speech-to-text)
- **Type Safety**: [TypeScript](https://www.typescriptlang.org/)

## 📝 使用说明

1. **文件上传**：
   - 点击 "File Upload" 标签
   - 选择本地音频文件
   - 点击 "Transcribe" 开始转录

2. **URL 输入**：
   - 点击 "URL Input" 标签
   - 输入播客链接（支持小宇宙播客）
   - 点击 "Transcribe" 开始转录

3. **查看结果**：
   - 转录完成后会显示详细的文本内容
   - 同时生成内容摘要
   - 可以通过下载按钮保存转录文本和摘要

## 🤝 贡献

欢迎提交 Pull Requests 和 Issues！

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情。
