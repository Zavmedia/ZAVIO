
export enum DecisionClassification {
  NO_ACTION = 'NO_ACTION',
  MONITOR = 'MONITOR',
  ADVISE = 'ADVISE',
  ALERT = 'ALERT',
  ACTION_READY = 'ACTION_READY',
  EXECUTING = 'EXECUTING'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum ZavioDomain {
  GENERAL = 'General',
  PRODUCTIVITY = 'Productivity',
  LEARNING = 'Learning',
  TECHNICAL = 'Technical',
  CREATIVE = 'Creative',
  SYSTEM = 'System'
}

export enum TaskType {
  CODE = 'code',
  IMAGE_GEN = 'image_generation',
  WEB_SEARCH = 'web_search',
  ML_TRAINING = 'machine_learning',
  DOCUMENT_ANALYSIS = 'document_analysis',
  VOICE_INTERACTION = 'voice',
  GENERAL = 'general'
}

export type AIModel = 'Gemini' | 'Gemini Native Voice' | 'Qwen Coder' | 'Perplexity' | 'Nano Banana' | 'NotebookLM';

export interface AnalysisResult {
  modelUsed?: AIModel;
  taskType?: TaskType;
  id: string;
  timestamp: number;
  response?: string; // Conversational AI response
  inputSummary: string;
  classification: DecisionClassification;
  confidence: number;
  riskLevel: RiskLevel;
  reasoning: string;
  keyAssumptions: string[];
  failureScenarios: string[];
  actionableStep?: string;
  groundingUrls?: Array<{ title: string; uri: string }>;
  detectedTask?: string | null; // Auto-detected task from user input
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'user' | 'zavio' | 'system';
  content: string | AnalysisResult;
  isAudio?: boolean;
}

export interface SystemState {
  status: 'STANDBY' | 'THINKING' | 'LISTENING' | 'SPEAKING' | 'ERROR';
  activeDomain: ZavioDomain;
  thinking: boolean;
  liveMode: boolean;
}

export interface VoiceShortcut {
  id: string;
  trigger: string;
  command: string;
}
