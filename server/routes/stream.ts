/**
 * ZAVIO Streaming Routes
 * 
 * Server-Sent Events (SSE) endpoints for real-time streaming responses.
 * Enables progressive UI updates and reduced perceived latency.
 */

import { Router, Request, Response } from 'express';
import { GoogleGenAI, Type, Schema } from "@google/genai";

const router = Router();

// --- SSE Headers ---
const setSSEHeaders = (res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();
};

// --- Send SSE Event ---
const sendEvent = (res: Response, event: string, data: any) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
};

// --- GET /api/stream/analyze ---
// Streaming analysis endpoint using SSE
router.get('/analyze', async (req: Request, res: Response) => {
    const { input, domain } = req.query;

    if (!input) {
        res.status(400).json({ error: 'Input query parameter required' });
        return;
    }

    setSSEHeaders(res);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        sendEvent(res, 'error', { message: 'API key not configured' });
        res.end();
        return;
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        // Send initial status
        sendEvent(res, 'status', { phase: 'INITIALIZING', message: 'Connecting to ZAVIO Core...' });

        const systemInstruction = `You are ZAVIO, an intelligent operating assistant. Analyze the input and provide structured reasoning.`;

        const fullPrompt = `
      DOMAIN: ${(domain as string || 'General').toUpperCase()}
      INPUT: "${input}"
      
      Provide analysis with:
      1. Summary (5 words max)
      2. Classification (NO_ACTION, MONITOR, ADVISE, ALERT, ACTION_READY)
      3. Confidence (0-100)
      4. Risk Level (LOW, MEDIUM, HIGH)
      5. Reasoning (detailed bullet points)
      6. Actionable Step (if applicable)
    `;

        sendEvent(res, 'status', { phase: 'THINKING', message: 'Processing neural pathways...' });

        // Use streaming generation
        const response = await ai.models.generateContentStream({
            model: 'gemini-2.0-flash',
            contents: fullPrompt,
            config: {
                systemInstruction
            }
        });

        let fullText = '';
        let chunkCount = 0;

        // Stream chunks to client
        for await (const chunk of response) {
            const text = chunk.text;
            if (text) {
                fullText += text;
                chunkCount++;

                sendEvent(res, 'chunk', {
                    text,
                    chunkIndex: chunkCount,
                    partialContent: fullText
                });
            }
        }

        // Parse final result
        sendEvent(res, 'status', { phase: 'FINALIZING', message: 'Compiling analysis...' });

        // Try to extract structured data from the response
        const analysis = parseAnalysisFromText(fullText);

        sendEvent(res, 'complete', {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            ...analysis,
            rawText: fullText
        });

        sendEvent(res, 'status', { phase: 'STANDBY', message: 'Analysis complete.' });

    } catch (error: any) {
        console.error('[STREAM] Error:', error.message);
        sendEvent(res, 'error', { message: error.message });
    } finally {
        res.end();
    }
});

// --- Helper: Parse Analysis from Text ---
const parseAnalysisFromText = (text: string): any => {
    // Extract key information using regex patterns
    const summaryMatch = text.match(/summary[:\s]*([^\n]+)/i);
    const classMatch = text.match(/(NO_ACTION|MONITOR|ADVISE|ALERT|ACTION_READY|EXECUTING)/i);
    const confMatch = text.match(/confidence[:\s]*(\d+)/i);
    const riskMatch = text.match(/(LOW|MEDIUM|HIGH)\s*risk/i) || text.match(/risk[:\s]*(LOW|MEDIUM|HIGH)/i);

    return {
        inputSummary: summaryMatch?.[1]?.trim().substring(0, 50) || 'Analysis Complete',
        classification: classMatch?.[1]?.toUpperCase() || 'ADVISE',
        confidence: parseInt(confMatch?.[1] || '75'),
        riskLevel: riskMatch?.[1]?.toUpperCase() || 'LOW',
        reasoning: text,
        keyAssumptions: [],
        failureScenarios: []
    };
};

// --- GET /api/stream/speak ---
// Streaming TTS with progress updates
router.get('/speak', async (req: Request, res: Response) => {
    const { text } = req.query;

    if (!text) {
        res.status(400).json({ error: 'Text query parameter required' });
        return;
    }

    setSSEHeaders(res);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        sendEvent(res, 'error', { message: 'API key not configured' });
        res.end();
        return;
    }

    try {
        sendEvent(res, 'status', { phase: 'GENERATING', message: 'Synthesizing voice...' });

        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text as string }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Fenrir' },
                    },
                },
            },
        });

        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (audioData) {
            sendEvent(res, 'audio', {
                base64: audioData,
                format: 'audio/mp3'
            });
            sendEvent(res, 'status', { phase: 'COMPLETE', message: 'Audio ready.' });
        } else {
            sendEvent(res, 'error', { message: 'No audio generated' });
        }

    } catch (error: any) {
        console.error('[STREAM TTS] Error:', error.message);
        sendEvent(res, 'error', { message: error.message });
    } finally {
        res.end();
    }
});

export default router;
