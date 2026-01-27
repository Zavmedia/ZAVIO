/**
 * ZAVIO Frontend Service - API Client
 * 
 * This service acts as a thin HTTP client, proxying all requests
 * to the backend server. Includes retry logic and error handling.
 */

import { AnalysisResult, ZavioDomain } from "../types";

const API_BASE_URL = '/api';

// --- Retry Configuration ---
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

// --- Helper: Sleep ---
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Helper: Handle API Errors with Retry ---
const fetchWithRetry = async (url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || error.error || `API Error: ${response.status}`);
    }

    return response;
  } catch (error: any) {
    if (retries > 0 && !error.message.includes('aborted')) {
      console.log(`[ZAVIO] Request failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};

// --- Helper: Safe JSON Parse ---
const safeParseResponse = async (response: Response): Promise<any> => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error('[ZAVIO] Failed to parse JSON:', text.substring(0, 200));
    throw new Error('Invalid response from server');
  }
};

// --- Get or create session ID ---
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('zavio_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('zavio_session_id', sessionId);
  }
  return sessionId;
};

// --- Core Analysis ---
export const analyzeInput = async (
  input: string,
  domain: ZavioDomain,
  imageBase64?: string,
  mimeType?: string
): Promise<AnalysisResult> => {
  const sessionId = getSessionId();

  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, domain, imageBase64, mimeType, sessionId })
    });

    const data = await safeParseResponse(response);

    // Ensure we have a valid response
    if (!data.response && !data.reasoning) {
      data.response = data.actionableStep || 'Request processed successfully.';
    }

    return data;
  } catch (error: any) {
    console.error('[ZAVIO] Analysis failed:', error.message);

    // Return a user-friendly error response instead of throwing
    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      inputSummary: input.substring(0, 30) + '...',
      classification: 'ALERT' as any,
      confidence: 0,
      riskLevel: 'HIGH' as any,
      reasoning: `Connection error: ${error.message}`,
      response: `**Connection Error**\n\nI encountered an issue processing your request:\n\n\`${error.message}\`\n\n**Troubleshooting:**\n1. Check if the backend server is running on port 3001\n2. Verify your API keys are set in the .env file\n3. Check the server console for detailed error messages\n\n**Commands to restart servers:**\n\`\`\`bash\nnpm run dev:server\nnpm run dev\n\`\`\``,
      keyAssumptions: [],
      failureScenarios: ['Network error', 'Server not running'],
      actionableStep: 'Check server status and restart if needed'
    };
  }
};

// --- Audio Transcription ---
export const transcribeAudio = async (audioBase64: string, mimeType: string = "audio/webm"): Promise<string> => {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64, mimeType })
    });

    const data = await safeParseResponse(response);
    return data.text || "";
  } catch (error: any) {
    console.error('[ZAVIO] Transcription failed:', error.message);
    return "";
  }
};

// --- Grounding / Search ---
export const verifyIntel = async (query: string): Promise<{ text: string, sources?: any[] }> => {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    return await safeParseResponse(response);
  } catch (error: any) {
    console.error('[ZAVIO] Verification failed:', error.message);
    return { text: 'Verification unavailable', sources: [] };
  }
};

// --- Text to Speech ---
export const speakAlert = async (text: string): Promise<AudioBuffer> => {
  const response = await fetchWithRetry(`${API_BASE_URL}/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  const data = await safeParseResponse(response);

  if (!data.audioBase64) throw new Error("No audio returned from server");

  // Decode base64 to AudioBuffer
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const binaryString = atob(data.audioBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const bufferCopy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return await audioContext.decodeAudioData(bufferCopy);
};
