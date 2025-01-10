export interface AIVoiceConfig {
  tempAudioDir: string;
  tempTextDir: string;
  ttsModel: string;
  ttsVoice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  sttModel: string;
}

export interface SaveTextResult {
  success: boolean;
  filePath?: string;
  error?: Error;
}

export interface TTSRequestResult {
  success: boolean;
  audioBase64?: string;
  error?: Error;
}

export interface STTRequestResult {
  success: boolean;
  transcript?: string;
  error?: Error;
}
