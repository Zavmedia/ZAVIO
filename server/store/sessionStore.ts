/**
 * ZAVIO Session Store
 * 
 * Provides in-memory session management with file-based persistence.
 * Sessions contain decision history, user preferences, and context.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AnalysisResult } from '../services/geminiService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// --- Types ---
export interface UserPreferences {
    defaultDomain: string;
    voiceEnabled: boolean;
    autoExecuteLevel: number; // 0=never, 1=low-risk, 2=all
    theme: 'dark' | 'light';
}

export interface Session {
    id: string;
    decisions: AnalysisResult[];
    preferences: UserPreferences;
    context: {
        currentGoal?: string;
        activeTasks: string[];
        recentTopics: string[];
    };
    createdAt: number;
    lastActive: number;
}

// --- Default Values ---
const DEFAULT_PREFERENCES: UserPreferences = {
    defaultDomain: 'General',
    voiceEnabled: true,
    autoExecuteLevel: 0,
    theme: 'dark'
};

const createNewSession = (id: string): Session => ({
    id,
    decisions: [],
    preferences: { ...DEFAULT_PREFERENCES },
    context: {
        activeTasks: [],
        recentTopics: []
    },
    createdAt: Date.now(),
    lastActive: Date.now()
});

// --- In-Memory Store ---
const sessions: Map<string, Session> = new Map();

// --- File Operations ---
const getSessionPath = (id: string) => path.join(DATA_DIR, `session_${id}.json`);

const loadSessionFromFile = (id: string): Session | null => {
    const filePath = getSessionPath(id);
    if (fs.existsSync(filePath)) {
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (e) {
            console.error(`[SESSION] Failed to load session ${id}:`, e);
            return null;
        }
    }
    return null;
};

const saveSessionToFile = (session: Session): void => {
    const filePath = getSessionPath(session.id);
    try {
        fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
    } catch (e) {
        console.error(`[SESSION] Failed to save session ${session.id}:`, e);
    }
};

// --- Public API ---

export const getSession = (id: string): Session => {
    // Check memory first
    if (sessions.has(id)) {
        const session = sessions.get(id)!;
        session.lastActive = Date.now();
        return session;
    }

    // Try loading from file
    const loaded = loadSessionFromFile(id);
    if (loaded) {
        loaded.lastActive = Date.now();
        sessions.set(id, loaded);
        return loaded;
    }

    // Create new session
    const newSession = createNewSession(id);
    sessions.set(id, newSession);
    saveSessionToFile(newSession);
    return newSession;
};

export const addDecision = (sessionId: string, decision: AnalysisResult): Session => {
    const session = getSession(sessionId);

    // Add to history (keep last 100)
    session.decisions.unshift(decision);
    if (session.decisions.length > 100) {
        session.decisions = session.decisions.slice(0, 100);
    }

    // Update context
    if (decision.inputSummary) {
        session.context.recentTopics.unshift(decision.inputSummary);
        if (session.context.recentTopics.length > 10) {
            session.context.recentTopics = session.context.recentTopics.slice(0, 10);
        }
    }

    session.lastActive = Date.now();
    saveSessionToFile(session);
    return session;
};

export const updatePreferences = (sessionId: string, prefs: Partial<UserPreferences>): Session => {
    const session = getSession(sessionId);
    session.preferences = { ...session.preferences, ...prefs };
    session.lastActive = Date.now();
    saveSessionToFile(session);
    return session;
};

export const updateContext = (sessionId: string, context: Partial<Session['context']>): Session => {
    const session = getSession(sessionId);
    session.context = { ...session.context, ...context };
    session.lastActive = Date.now();
    saveSessionToFile(session);
    return session;
};

export const clearHistory = (sessionId: string): Session => {
    const session = getSession(sessionId);
    session.decisions = [];
    session.context.recentTopics = [];
    saveSessionToFile(session);
    return session;
};

export const deleteSession = (sessionId: string): boolean => {
    sessions.delete(sessionId);
    const filePath = getSessionPath(sessionId);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
    }
    return false;
};

// --- Logging ---
console.log(`[SESSION STORE] Initialized. Data dir: ${DATA_DIR}`);
