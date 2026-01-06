# Podcast Transcription App
![](./public/demo.png)

A podcast transcription application based on Next.js and OpenAI Whisper API, supporting audio file transcription and intelligent summary generation.

## ✨ Features

- 🎯 Support both file upload and URL input
- 🎙️ Support for Xiaoyuzhou podcast transcription
- 📝 High-quality audio transcription using OpenAI Whisper API
- 📊 AI-powered content summarization
- 🎨 Modern UI design
- 💾 Download transcripts and summaries
- 🎵 Built-in audio player
- 🖥️ CLI tool support (`pt` command)
- 📋 SRT subtitle format output
- 🔄 Chunked processing for large audio files
- ⚡ Parallel transcription for better performance
- 📤 Multiple output formats (text, JSON, markdown, SRT)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API Key
- FFmpeg (required for audio processing)

#### Installing FFmpeg

```bash
# macOS
brew install ffmpeg

# Linux (Ubuntu/Debian)
sudo apt-get install ffmpeg

# Windows
choco install ffmpeg
```

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

### Docker Deployment

1. Build the Docker image:
```bash
docker build -t podcast-transcription .
```

2. Run the container:
```bash
docker run -p 3000:3000 podcast-transcription
```

### Zeabur Deployment

This project is deployed using [Zeabur](https://zeabur.com).

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **API**: [OpenAI Whisper](https://platform.openai.com/docs/guides/speech-to-text)
- **Type Safety**: [TypeScript](https://www.typescriptlang.org/)
- **Testing**: [Vitest](https://vitest.dev/)
- **CLI**: [Commander.js](https://github.com/tj/commander.js)
- **Audio Processing**: [FFmpeg](https://ffmpeg.org/)

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

## 🖥️ CLI Tool

The project includes a command-line tool `pt` for transcribing audio files directly from the terminal.

### CLI Usage

```bash
pt <input> [options]
```

**Arguments:**
- `<input>` - Local file path or audio URL

**Options:**
- `-s, --summary` - Generate AI summary after transcription
- `-l, --language <lang>` - Language code: `auto`, `en`, `zh`, etc. (default: `auto`)
- `-o, --output <file>` - Output file path (default: stdout)
- `--output-format <format>` - Output format: `text`, `json`, `markdown`, `srt` (default: `text`)
- `-q, --quiet` - Suppress progress output

### CLI Examples

```bash
# Transcribe a local audio file
pt /path/to/podcast.mp3

# Transcribe with AI summary
pt podcast.mp3 --summary

# Generate SRT subtitles
pt podcast.mp3 --output-format srt -o subtitles.srt

# JSON output with summary
pt podcast.mp3 --summary --output-format json -o result.json

# Transcribe from URL
pt https://example.com/audio.mp3 --summary
```

### Running the CLI

```bash
# Via npm script
npm run pt <input> [options]

# Or after global install
npm link
pt <input> [options]
```

## 🤝 Contributing

Pull Requests and Issues are welcome!

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=winterfx/Podcast-Transcription&type=Date)](https://star-history.com/#winterfx/Podcast-Transcription&Date)
