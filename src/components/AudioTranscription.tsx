'use client';

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Loader2, Upload, Download, FileAudio, Volume2, FileText, FileStack, Link } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getFileExtension, getMimeType } from '@/lib/audio'

export default function AudioTranscription() {
  const [audioUrl, setAudioUrl] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [transcription, setTranscription] = useState('')
  const [summary, setSummary] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 清理之前的 URL 输入状态
      setUrlInput('')
      // 清理之前的音频 URL（如果存在）
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      setAudioFile(file)
      setAudioUrl(URL.createObjectURL(file))
    }
  }

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput) return

    setIsLoading(true)
    try {
      // 清理之前的状态
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      setAudioUrl('')
      setAudioFile(null)
      const response = await fetch('/api/audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlInput }),
      });

      if (!response.ok) {
        throw new Error('Failed to download audio');
      }

      // 创建 blob URL 用于音频播放
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setAudioUrl(blobUrl);

      const extension = getFileExtension(urlInput);
      const mimeType = getMimeType(blob, urlInput);
      const audioFile = new File([blob], `podcast.${extension}`, { type: mimeType });
      setAudioFile(audioFile);

      // 开始转录
      const formData = new FormData();
      formData.append('file', audioFile);
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeResponse.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const data = await transcribeResponse.json();
      setTranscription(data.transcript);

      // 生成摘要
      const summaryResponse = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: data.transcript }],
        }),
      });

      if (!summaryResponse.ok) {
        throw new Error('Failed to generate summary');
      }

      const summaryData = await summaryResponse.json();
      setSummary(summaryData.summary);
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to process audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!audioFile) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', audioFile)

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to transcribe audio')
      }

      const data = await response.json()
      setTranscription(data.transcript);

      // 生成摘要
      const summaryResponse = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: data.transcript }],
        }),
      });

      if (!summaryResponse.ok) {
        throw new Error('Failed to generate summary');
      }

      const summaryData = await summaryResponse.json();
      setSummary(summaryData.summary);
    } catch (err) {
      console.error('Error:', err)
      alert('Failed to process audio. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // 组件卸载时清理 blob URL
  useEffect(() => {
    return () => {
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Audio Transcription
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Transform your <span className="text-indigo-600 dark:text-indigo-400">podcasts</span> and <span className="text-indigo-600 dark:text-indigo-400">audio files</span> into text with <span className="text-indigo-600 dark:text-indigo-400">AI-powered</span> transcription and get intelligent summaries.
          </p>
        </div>

        {/* Upload Section */}
        <Card className="border-2 border-dashed bg-white/50 backdrop-blur-sm dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileAudio className="h-5 w-5" />
              <span>Upload Audio</span>
            </CardTitle>
            <CardDescription>
              Upload your audio file or paste a podcast URL (supports podcast and direct audio links)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs 
              defaultValue="file" 
              className="w-full"
              onValueChange={(_) => {
                // 切换 tab 时清理状态
                if (audioUrl) {
                  URL.revokeObjectURL(audioUrl)
                }
                setAudioUrl('')
                setAudioFile(null)
                setUrlInput('')
                setTranscription('')
                setSummary('')
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  File Upload
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  URL Input
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="file" className="mt-4">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg hover:border-primary cursor-pointer">
                      <Upload className="h-5 w-5" />
                      <span>{audioFile ? audioFile.name : 'Choose audio file'}</span>
                    </div>
                  </div>
                  <Button 
                    onClick={handleUploadSubmit}
                    disabled={!audioFile || isLoading}
                    className="min-w-[120px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing
                      </>
                    ) : (
                      <>
                        <Volume2 className="mr-2 h-4 w-4" />
                        Transcribe
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="url" className="mt-4">
                <form onSubmit={handleUrlSubmit} className="flex gap-4">
                  <Input
                    type="url"
                    placeholder="Enter podcast URL or direct audio link (e.g., https://www.xiaoyuzhoufm.com/... or https://example.com/audio.mp3..)"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    type="submit"
                    disabled={!urlInput || isLoading}
                    className="min-w-[120px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing
                      </>
                    ) : (
                      <>
                        <Volume2 className="mr-2 h-4 w-4" />
                        Transcribe
                      </>
                    )}
                  </Button>
                </form>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>目前支持的播客链接:</span>
                  <img 
                    src="/xiaoyuzhou-logo.png" 
                    alt="Xiaoyuzhou logo"
                    className="h-4 w-4"
                  />
                </div>
              </TabsContent>
            </Tabs>

            {audioUrl && (
              <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
                <audio controls className="flex-1">
                  <source src={audioUrl} type={audioFile?.type} />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {(transcription || summary) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Transcription Card */}
            {transcription && (
              <Card className="h-full bg-white/50 backdrop-blur-sm dark:bg-gray-800/50 hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <span>Transcription</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const blob = new Blob([transcription], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'transcription.txt';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="hover:bg-primary hover:text-primary-foreground"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div 
                      className="whitespace-pre-wrap text-base leading-7 tracking-wide overflow-y-auto max-h-[600px] scrollbar-thin"
                      style={{
                        fontSize: '1rem',
                        lineHeight: '1.75',
                      }}
                    >
                      {transcription}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary Card */}
            {summary && (
              <Card className="h-full bg-white/50 backdrop-blur-sm dark:bg-gray-800/50 hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FileStack className="h-5 w-5" />
                      <span>Summary</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const blob = new Blob([summary], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'summary.txt';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="hover:bg-primary hover:text-primary-foreground"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div 
                      className="whitespace-pre-wrap text-base leading-7 tracking-wide overflow-y-auto max-h-[600px] scrollbar-thin"
                      style={{
                        fontSize: '1rem',
                        lineHeight: '1.75',
                      }}
                    >
                      {summary}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
