export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastModified: number;
  characters: CharacterProfile[];
}

export interface CharacterProfile {
  id: string;
  name: string;
  role: string;
  appearance: string;
  backstory: string;
  strengths: string;
  weaknesses: string;
  goals: string;
  relationships: string;
}

export enum ModelType {
  // Use 3.0 Flash for basic tasks like titling/summarization
  GEMINI_FLASH = 'gemini-3-flash-preview', 
  // Use 2.5 Flash for chat if requested (legacy/compat) or keep using 3.0
  GEMINI_FLASH_LEGACY = 'gemini-2.5-flash-latest',
  GEMINI_PRO = 'gemini-3-pro-preview',
}

export interface SuggestionRequest {
  field: keyof CharacterProfile;
  currentProfile: Partial<CharacterProfile>;
}

// Extend Window interface to handle global PWA event
declare global {
  interface Window {
    deferredPrompt: any;
  }
}
