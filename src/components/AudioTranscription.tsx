'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Loader2, Download, FileAudio, FileText, FileStack, Link, Podcast, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { getFileExtension, getMimeType } from '@/lib/audio';

export default function AudioTranscription() {
  const [audioUrl, setAudioUrl] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'url' | 'podcast'>('url');
  const [selectedPlatform, setSelectedPlatform] = useState('xiaoyuzhou');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUrlInput('');
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
      // 重置转录和总结
      setTranscription('');
      setSummary('');
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;

    setIsLoading(true);
    try {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl('');
      setAudioFile(null);
      // 重置转录和总结
      setTranscription('');
      setSummary('');

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

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setAudioUrl(blobUrl);

      const extension = getFileExtension(urlInput);
      const mimeType = getMimeType(blob, urlInput);
      const audioFile = new File([blob], `podcast.${extension}`, { type: mimeType });
      setAudioFile(audioFile);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process audio. Please try again.');
    } finally {
      setIsLoading(false);
      setDialogOpen(false);
    }
  };

  const handleTranscribe = async () => {
    if (!audioFile) return;

    setIsTranscribing(true);
    try {
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
      setError(err instanceof Error ? err.message : 'Failed to process audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

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
            Transform your <span className="text-indigo-600 dark:text-indigo-400">podcasts</span> and <span className="text-indigo-600 dark:text-indigo-400">audio files or urls</span> into text with <span className="text-indigo-600 dark:text-indigo-400">AI-powered</span> transcription and get intelligent summaries.
          </p>
        </div>

        {/* Upload Section */}
        <div className="flex flex-col justify-center items-center rounded-lg bg-white shadow-xl shadow-black/5 ring-1 ring-slate-700/10 p-2 max-w-fit mx-auto">
          <div className="flex flex-row justify-center space-x-2">
            <button
              onClick={() => {
                setDialogType('podcast');
                setDialogOpen(true);
              }}
              className="flex items-center justify-center rounded-lg p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
            >
              <Podcast className="w-5 h-5" />
              <span className="ml-2">From Podcast</span>
              <Star className="w-4 h-4 ml-1 fill-yellow-400 text-yellow-400" />
            </button>
            <div className="w-[1px] bg-slate-200"></div>
            <button
              onClick={() => document.getElementById('file-upload')?.click()}
              className="flex items-center justify-center rounded-lg p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
            >
              <FileAudio className="w-5 h-5" />
              <span className="ml-2">From File</span>
            </button>
            <div className="w-[1px] bg-slate-200"></div>
            <button
              onClick={() => {
                setDialogType('url');
                setDialogOpen(true);
              }}
              className="flex items-center justify-center rounded-lg p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
            >
              <Link className="w-5 h-5" />
              <span className="ml-2">From URL</span>
            </button>
          </div>

          <input
            id="file-upload"
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {dialogType === 'podcast' ? 'Enter Podcast URL' : 'Enter Audio URL'}
                </DialogTitle>
                <DialogDescription>
                  {dialogType === 'podcast' 
                    ? 'Paste the URL of the podcast episode you want to transcribe'
                    : 'Paste the direct audio URL you want to transcribe'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUrlSubmit}>
                <div className="space-y-4">
                  {dialogType === 'podcast' && (
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedPlatform}
                      onChange={(e) => setSelectedPlatform(e.target.value)}
                    >
                      <option value="xiaoyuzhou">小宇宙</option>
                    </select>
                  )}
                  
                  <Input
                    type="url"
                    placeholder={
                      dialogType === 'podcast' 
                        ? 'Enter podcast URL...' 
                        : 'Enter audio URL...'
                    }
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full"
                    required
                  />
                  
                  <Button 
                    type="submit"
                    disabled={isLoading || !urlInput}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Submit'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {audioUrl && (
          <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
            <audio controls className="flex-1">
              <source src={audioUrl} type={audioFile?.type} />
              Your browser does not support the audio element.
            </audio>
            <Button
              onClick={handleTranscribe}
              disabled={isTranscribing}
              className="flex items-center gap-2"
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Transcribing...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Transcribe
                </>
              )}
            </Button>
          </div>
        )}

        {(transcription || summary) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setError(null)}
            >
              <span className="sr-only">Dismiss</span>
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
