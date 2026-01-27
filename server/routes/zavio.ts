import { Router, Request, Response } from 'express';
import * as GeminiService from '../services/geminiService.js';
import * as OpenRouterService from '../services/openrouterService.js';
import * as PermissionService from '../services/permissionService.js';
import { OrchestratorService } from '../services/orchestrator.js';
import { generateImage } from '../services/imageService.js';

// --- AI Provider Selection ---
const AI_PROVIDER = process.env.AI_PROVIDER || 'openrouter';
const AIService = AI_PROVIDER === 'gemini' ? GeminiService : OpenRouterService;

console.log(`[ZAVIO] Using AI Provider: ${AI_PROVIDER.toUpperCase()}`);

const router = Router();

// --- POST /api/analyze ---
router.post('/analyze', async (req: Request, res: Response) => {
    try {
        const { input, domain, imageBase64, mimeType, sessionId } = req.body;

        if (!input && !imageBase64) {
            return res.status(400).json({ error: 'Input or image required.' });
        }

        console.log(`[ZAVIO] Analyzing: "${input?.substring(0, 50)}..." | Domain: ${domain} | Session: ${sessionId || 'default'}`);

        // Classify task and select appropriate model
        const classification = OrchestratorService.classifyTask(input || "", !!imageBase64);
        const selectedModel = OrchestratorService.getFallbackModel(classification.model);
        const modelId = OrchestratorService.getOpenRouterModelId(selectedModel);

        console.log(`[ORCHESTRATOR] Task: ${classification.taskType} | Model: ${selectedModel} (${modelId})`);
        console.log(`[ORCHESTRATOR] ${classification.reasoning}`);

        // Special handling for image generation
        if (classification.taskType === 'image_generation') {
            console.log('[IMAGE GEN] Detected image generation request');
            const apiKey = process.env.OPENROUTER_API_KEY || process.env.OR_API_KEY || '';

            if (!apiKey) {
                return res.json({
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    response: "⚠️ **API Key Missing**\n\nI detected an image generation request, but the OpenRouter API key is missing from the server environment. Please set `OPENROUTER_API_KEY` in the `.env` file.",
                    modelUsed: 'System',
                    taskType: classification.taskType,
                    classification: 'ADVISE',
                    confidence: 100
                });
            }

            // Generate image using real service
            const imageResult = await generateImage(input || "abstract image", apiKey);

            if (imageResult.success) {
                return res.json({
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    response: `🎨 **Image Generated Successfully**\n\nHere is your image for: "${input}"\n\n![Generated Image](${imageResult.imageUrl})\n\n*Generated with Flux.2 Pro via OpenRouter*`,
                    modelUsed: 'Nano Banana', // Flux
                    taskType: classification.taskType,
                    inputSummary: input?.substring(0, 30) + '...',
                    classification: 'ACTION_READY',
                    confidence: 100,
                    riskLevel: 'LOW',
                    reasoning: 'Successfully generated image',
                    keyAssumptions: [],
                    failureScenarios: [],
                    actionableStep: 'View image above'
                });
            } else {
                return res.json({
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    response: `⚠️ **Image Generation Failed**\n\n${imageResult.error}\n\n${imageResult.fallbackMessage || ''}`,
                    modelUsed: 'Nano Banana',
                    taskType: classification.taskType,
                    classification: 'ADVISE',
                    confidence: 0
                });
            }
        }

        const result = await AIService.analyzeInput(
            input || "Analyze visual context.",
            domain || 'General',
            imageBase64,
            mimeType,
            sessionId || 'default',
            modelId,              // ← Pass OpenRouter model ID
            classification.taskType
        );

        // Override modelUsed with friendly name for UI display
        result.modelUsed = selectedModel;

        res.json(result);
    } catch (error: any) {
        console.error('[API /analyze] Error:', error.message);
        res.status(500).json({ error: 'Analysis failed.', message: error.message });
    }
});

// --- POST /api/transcribe ---
router.post('/transcribe', async (req: Request, res: Response) => {
    try {
        const { audioBase64, mimeType } = req.body;

        if (!audioBase64) {
            return res.status(400).json({ error: 'Audio data required.' });
        }

        console.log(`[ZAVIO] Transcribing audio (${mimeType || 'audio/webm'})...`);

        const text = await AIService.transcribeAudio(audioBase64, mimeType);

        res.json({ text });
    } catch (error: any) {
        console.error('[API /transcribe] Error:', error.message);
        res.status(500).json({ error: 'Transcription failed.', message: error.message });
    }
});

// --- POST /api/verify ---
router.post('/verify', async (req: Request, res: Response) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query required.' });
        }

        console.log(`[ZAVIO] Verifying intel: "${query.substring(0, 50)}..."`);

        const result = await AIService.verifyIntel(query);

        res.json(result);
    } catch (error: any) {
        console.error('[API /verify] Error:', error.message);
        res.status(500).json({ error: 'Verification failed.', message: error.message });
    }
});

// --- POST /api/speak ---
router.post('/speak', async (req: Request, res: Response) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text required.' });
        }

        console.log(`[ZAVIO] Generating speech: "${text.substring(0, 30)}..."`);

        const audioBase64 = await AIService.speakAlert(text);

        res.json({ audioBase64 });
    } catch (error: any) {
        console.error('[API /speak] Error:', error.message);
        res.status(500).json({ error: 'TTS failed.', message: error.message });
    }
});

// --- POST /api/execute ---
// Execute an action with permission checking
router.post('/execute', async (req: Request, res: Response) => {
    try {
        const { actionId, parameters, sessionId } = req.body;

        if (!actionId) {
            return res.status(400).json({ error: 'Action ID required.' });
        }

        // Check permission first
        const permission = PermissionService.checkPermission(actionId);

        if (!permission.allowed) {
            console.log(`[EXECUTE] BLOCKED: ${actionId} - ${permission.reason}`);
            return res.status(403).json({
                allowed: false,
                error: permission.reason,
                actionId
            });
        }

        // If requires dry-run, simulate first
        if (permission.requiresDryRun) {
            const simulation = await PermissionService.simulateAction({
                actionId,
                parameters: parameters || {},
                sessionId: sessionId || 'anonymous',
                isDryRun: true
            });

            return res.json({
                requiresConfirmation: true,
                simulation,
                message: 'Dry-run complete. Confirm to execute.'
            });
        }

        // Execute action
        const result = await PermissionService.executeAction({
            actionId,
            parameters: parameters || {},
            sessionId: sessionId || 'anonymous',
            isDryRun: false
        });

        console.log(`[EXECUTE] Completed: ${actionId}`);
        res.json(result);
    } catch (error: any) {
        console.error('[API /execute] Error:', error.message);
        res.status(500).json({ error: 'Execution failed.', message: error.message });
    }
});

// --- POST /api/simulate ---
// Simulate an action without executing (dry-run)
router.post('/simulate', async (req: Request, res: Response) => {
    try {
        const { actionId, parameters, sessionId } = req.body;

        if (!actionId) {
            return res.status(400).json({ error: 'Action ID required.' });
        }

        console.log(`[SIMULATE] Running dry-run for: ${actionId}`);

        const result = await PermissionService.simulateAction({
            actionId,
            parameters: parameters || {},
            sessionId: sessionId || 'anonymous',
            isDryRun: true
        });

        res.json(result);
    } catch (error: any) {
        console.error('[API /simulate] Error:', error.message);
        res.status(500).json({ error: 'Simulation failed.', message: error.message });
    }
});

// --- GET /api/actions ---
// Get list of registered actions and their permission levels
router.get('/actions', (req: Request, res: Response) => {
    try {
        const actions = PermissionService.getActionRegistry();
        res.json(actions);
    } catch (error: any) {
        console.error('[API /actions] Error:', error.message);
        res.status(500).json({ error: 'Failed to get actions.' });
    }
});

export default router;

