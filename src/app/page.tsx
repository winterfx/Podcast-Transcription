"use client"
import AudioTranscription from '@/components/AudioTranscription'

export default function Home() {
  const handleTranscriptionComplete = (transcript: string) => {
    console.log('Transcription completed:', transcript);
  };

  return (
    <div className="min-h-screen p-8">
      <AudioTranscription onTranscriptionComplete={handleTranscriptionComplete} />
    </div>
  )
}
