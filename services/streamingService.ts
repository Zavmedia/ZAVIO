/**
 * ZAVIO Streaming Service
 * 
 * Frontend service for SSE-based streaming responses.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// --- Types ---
export interface StreamEvent {
    type: 'status' | 'chunk' | 'complete' | 'error' | 'audio';
    data: any;
}

export type StreamCallback = (event: StreamEvent) => void;

// --- Streaming Analysis ---
export const analyzeInputStreaming = (
    input: string,
    domain: string,
    onEvent: StreamCallback
): () => void => {
    const url = new URL(`${API_BASE_URL}/stream/analyze`);
    url.searchParams.set('input', input);
    url.searchParams.set('domain', domain);

    const eventSource = new EventSource(url.toString());

    eventSource.addEventListener('status', (e) => {
        onEvent({ type: 'status', data: JSON.parse(e.data) });
    });

    eventSource.addEventListener('chunk', (e) => {
        onEvent({ type: 'chunk', data: JSON.parse(e.data) });
    });

    eventSource.addEventListener('complete', (e) => {
        onEvent({ type: 'complete', data: JSON.parse(e.data) });
        eventSource.close();
    });

    eventSource.addEventListener('error', (e) => {
        if (e instanceof MessageEvent) {
            onEvent({ type: 'error', data: JSON.parse(e.data) });
        } else {
            onEvent({ type: 'error', data: { message: 'Connection lost' } });
        }
        eventSource.close();
    });

    // Return cleanup function
    return () => {
        eventSource.close();
    };
};

// --- Streaming TTS ---
export const speakStreaming = (
    text: string,
    onEvent: StreamCallback
): () => void => {
    const url = new URL(`${API_BASE_URL}/stream/speak`);
    url.searchParams.set('text', text);

    const eventSource = new EventSource(url.toString());

    eventSource.addEventListener('status', (e) => {
        onEvent({ type: 'status', data: JSON.parse(e.data) });
    });

    eventSource.addEventListener('audio', (e) => {
        onEvent({ type: 'audio', data: JSON.parse(e.data) });
        eventSource.close();
    });

    eventSource.addEventListener('error', (e) => {
        if (e instanceof MessageEvent) {
            onEvent({ type: 'error', data: JSON.parse(e.data) });
        }
        eventSource.close();
    });

    return () => {
        eventSource.close();
    };
};
