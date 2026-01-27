import { Router, Request, Response } from 'express';
import MLAnalyticsService from '../services/mlAnalytics.js';

const router = Router();

/**
 * POST /api/ml/log
 * Log user interaction for pattern learning
 */
router.post('/log', (req: Request, res: Response) => {
    try {
        const { type, content, context, outcome } = req.body;

        if (!type || !content) {
            return res.status(400).json({ error: 'Type and content required' });
        }

        MLAnalyticsService.logInteraction({ type, content, context, outcome });

        res.json({ success: true });
    } catch (error: any) {
        console.error('[ML Analytics] Log error:', error.message);
        res.status(500).json({ error: 'Failed to log interaction' });
    }
});

/**
 * GET /api/ml/patterns
 * Get detected user patterns
 */
router.get('/patterns', (req: Request, res: Response) => {
    try {
        const patterns = MLAnalyticsService.getPatterns();
        res.json({ patterns });
    } catch (error: any) {
        console.error('[ML Analytics] Get patterns error:', error.message);
        res.status(500).json({ error: 'Failed to get patterns' });
    }
});

/**
 * GET /api/ml/insights
 * Get comprehensive user insights
 */
router.get('/insights', (req: Request, res: Response) => {
    try {
        const insights = MLAnalyticsService.getInsights();
        res.json(insights);
    } catch (error: any) {
        console.error('[ML Analytics] Get insights error:', error.message);
        res.status(500).json({ error: 'Failed to get insights' });
    }
});

/**
 * GET /api/ml/export
 * Export all ML data
 */
router.get('/export', (req: Request, res: Response) => {
    try {
        const data = MLAnalyticsService.exportData();
        res.json(data);
    } catch (error: any) {
        console.error('[ML Analytics] Export error:', error.message);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

/**
 * POST /api/ml/import
 * Import ML data
 */
router.post('/import', (req: Request, res: Response) => {
    try {
        const { interactions, patterns } = req.body;

        MLAnalyticsService.importData({ interactions, patterns });

        res.json({ success: true });
    } catch (error: any) {
        console.error('[ML Analytics] Import error:', error.message);
        res.status(500).json({ error: 'Failed to import data' });
    }
});

export default router;
