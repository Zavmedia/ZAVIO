/**
 * ZAVIO Session Service
 * 
 * Frontend service for session management - persistence, history, and preferences.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const SESSION_KEY = 'zavio_session_id';

// --- Types ---
export interface UserPreferences {
    defaultDomain: string;
    voiceEnabled: boolean;
    autoExecuteLevel: number;
    theme: 'dark' | 'light';
}

export interface SessionContext {
    currentGoal?: string;
    activeTasks: string[];
    recentTopics: string[];
}

export interface Session {
    id: string;
    decisions: any[];
    preferences: UserPreferences;
    context: SessionContext;
    createdAt: number;
    lastActive: number;
}

// --- Session ID Management ---
export const getSessionId = (): string => {
    let sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
};

export const clearSessionId = (): void => {
    localStorage.removeItem(SESSION_KEY);
};

// --- API Calls ---
export const loadSession = async (): Promise<Session> => {
    const sessionId = getSessionId();
    const response = await fetch(`${API_BASE_URL}/session/${sessionId}`);

    if (!response.ok) {
        throw new Error('Failed to load session');
    }

    return response.json();
};

export const saveDecision = async (decision: any): Promise<void> => {
    const sessionId = getSessionId();
    await fetch(`${API_BASE_URL}/session/${sessionId}/decision`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
    });
};

export const updatePreferences = async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    const sessionId = getSessionId();
    const response = await fetch(`${API_BASE_URL}/session/${sessionId}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
    });

    if (!response.ok) {
        throw new Error('Failed to update preferences');
    }

    return response.json();
};

export const updateContext = async (context: Partial<SessionContext>): Promise<SessionContext> => {
    const sessionId = getSessionId();
    const response = await fetch(`${API_BASE_URL}/session/${sessionId}/context`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context })
    });

    if (!response.ok) {
        throw new Error('Failed to update context');
    }

    return response.json();
};

export const clearHistory = async (): Promise<void> => {
    const sessionId = getSessionId();
    await fetch(`${API_BASE_URL}/session/${sessionId}/history`, {
        method: 'DELETE'
    });
};
