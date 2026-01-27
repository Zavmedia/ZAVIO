/**
 * ZAVIO Session Routes
 * 
 * API endpoints for session management, history retrieval, and preference updates.
 */

import { Router, Request, Response } from 'express';
import * as SessionStore from '../store/sessionStore.js';

const router = Router();

// --- GET /api/session/:id ---
// Load or create a session
router.get('/:id', (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id || id.length < 8) {
            return res.status(400).json({ error: 'Invalid session ID' });
        }

        const session = SessionStore.getSession(id);

        console.log(`[SESSION] Loaded session ${id} | Decisions: ${session.decisions.length}`);

        res.json(session);
    } catch (error: any) {
        console.error('[API /session] Error:', error.message);
        res.status(500).json({ error: 'Failed to load session' });
    }
});

// --- POST /api/session ---
// Create a new session with optional initial preferences
router.post('/', (req: Request, res: Response) => {
    try {
        const id = crypto.randomUUID();
        const session = SessionStore.getSession(id);

        // Apply initial preferences if provided
        if (req.body.preferences) {
            SessionStore.updatePreferences(id, req.body.preferences);
        }

        console.log(`[SESSION] Created new session ${id}`);

        res.status(201).json(session);
    } catch (error: any) {
        console.error('[API /session] Error:', error.message);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

// --- PUT /api/session/:id/decision ---
// Add a decision to history
router.put('/:id/decision', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { decision } = req.body;

        if (!decision) {
            return res.status(400).json({ error: 'Decision object required' });
        }

        const session = SessionStore.addDecision(id, decision);

        console.log(`[SESSION] Added decision to ${id} | Total: ${session.decisions.length}`);

        res.json({ success: true, totalDecisions: session.decisions.length });
    } catch (error: any) {
        console.error('[API /session/decision] Error:', error.message);
        res.status(500).json({ error: 'Failed to save decision' });
    }
});

// --- PUT /api/session/:id/preferences ---
// Update user preferences
router.put('/:id/preferences', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { preferences } = req.body;

        if (!preferences) {
            return res.status(400).json({ error: 'Preferences object required' });
        }

        const session = SessionStore.updatePreferences(id, preferences);

        console.log(`[SESSION] Updated preferences for ${id}`);

        res.json(session.preferences);
    } catch (error: any) {
        console.error('[API /session/preferences] Error:', error.message);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

// --- PUT /api/session/:id/context ---
// Update session context (current goal, active tasks)
router.put('/:id/context', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { context } = req.body;

        if (!context) {
            return res.status(400).json({ error: 'Context object required' });
        }

        const session = SessionStore.updateContext(id, context);

        res.json(session.context);
    } catch (error: any) {
        console.error('[API /session/context] Error:', error.message);
        res.status(500).json({ error: 'Failed to update context' });
    }
});

// --- DELETE /api/session/:id/history ---
// Clear decision history
router.delete('/:id/history', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        SessionStore.clearHistory(id);

        console.log(`[SESSION] Cleared history for ${id}`);

        res.json({ success: true });
    } catch (error: any) {
        console.error('[API /session/history] Error:', error.message);
        res.status(500).json({ error: 'Failed to clear history' });
    }
});

// --- DELETE /api/session/:id ---
// Delete entire session
router.delete('/:id', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = SessionStore.deleteSession(id);

        console.log(`[SESSION] Deleted session ${id}: ${deleted}`);

        res.json({ success: deleted });
    } catch (error: any) {
        console.error('[API /session] Error:', error.message);
        res.status(500).json({ error: 'Failed to delete session' });
    }
});

export default router;
