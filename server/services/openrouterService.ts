/**
 * ZAVIO OpenRouter Service
 * 
 * Alternative AI provider using OpenRouter for access to multiple models
 * including Gemma, Llama, Mistral, and more.
 */

// --- System Instructions (Compact for free tier) ---
const ZAVIO_SYSTEM_INSTRUCTION = `You are ZAVIO, a helpful AI assistant focused on business, coding, and money-making opportunities. Be concise but helpful.

RESPONSE FORMAT (JSON only):
{"response": "your answer", "inputSummary": "3 words", "classification": "ADVISE", "confidence": 85, "riskLevel": "LOW", "actionableStep": "next step", "detectedTask": null}

TASK DETECTION: If user mentions a task, to-do, reminder, or something they need to do (keywords: tomorrow, later, need to, remind me, schedule, don't forget), extract it:
- "detectedTask": "the task text" 
- Example: User says "I need to code tomorrow" → "detectedTask": "Code tomorrow"
- If no task mentioned, set to null.

Classifications: NO_ACTION, MONITOR, ADVISE, ALERT, ACTION_READY
For code: use markdown code blocks.
Be friendly, use hyphens not em dashes.`;

// --- Enums (mirrored from types) ---
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

export interface AnalysisResult {
    id: string;
    timestamp: number;
    response?: string; // Conversational AI response
    modelUsed?: string;
    taskType?: string;
    inputSummary: string;
    classification: DecisionClassification;
    confidence: number;
    riskLevel: RiskLevel;
    reasoning: string;
    keyAssumptions: string[];
    failureScenarios: string[];
    actionableStep?: string;
}


const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// --- Conversation History Store ---
interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

const conversationHistory: Map<string, ChatMessage[]> = new Map();

export const getConversationHistory = (sessionId: string): ChatMessage[] => {
    return conversationHistory.get(sessionId) || [];
};

export const addToHistory = (sessionId: string, role: 'user' | 'assistant', content: string) => {
    if (!conversationHistory.has(sessionId)) {
        conversationHistory.set(sessionId, []);
    }
    const history = conversationHistory.get(sessionId)!;
    history.push({ role, content });
    // Keep last 20 messages for context
    if (history.length > 20) {
        history.splice(0, history.length - 20);
    }
};

export const clearHistory = (sessionId: string) => {
    conversationHistory.delete(sessionId);
};

// --- Get API Key ---
const getApiKey = () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY environment variable is missing.");
    }
    return apiKey;
};

// --- Parse JSON from response ---
const parseJsonResponse = (text: string): any => {
    // Try to extract JSON from the response
    let clean = text.trim();

    // Remove markdown code blocks if present
    if (clean.startsWith('```json')) {
        clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
        clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Try to find JSON object in the text
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }

    return JSON.parse(clean);
};

// --- Core Analysis ---
export const analyzeInput = async (
    input: string,
    domain: string,
    imageBase64?: string,
    mimeType?: string,
    sessionId: string = 'default',
    modelOverride?: string,
    taskType?: string
): Promise<AnalysisResult> => {
    const apiKey = getApiKey();

    // Add user message to history
    addToHistory(sessionId, 'user', input);

    // Build messages with conversation history
    const history = getConversationHistory(sessionId);
    const messages: any[] = [
        { role: 'system', content: ZAVIO_SYSTEM_INSTRUCTION }
    ];

    // Add conversation history (last 10 exchanges for context)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
        messages.push({ role: msg.role, content: msg.content });
    }

    // Add image if provided
    if (imageBase64 && mimeType) {
        messages.push({
            role: 'user',
            content: [
                { type: 'text', text: input },
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
            ] as any
        });
    }

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'ZAVIO Assistant'
            },
            body: JSON.stringify({
                model: modelOverride || 'google/gemma-3-27b-it:free', // Free Gemma model
                messages,
                temperature: 0.3,
                max_tokens: 400
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;

        if (!text) throw new Error("No response from AI");

        let parsed: any;
        try {
            parsed = parseJsonResponse(text);
        } catch (e) {
            console.error("[OPENROUTER] JSON Parse Error. Raw text:", text);
            return {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                modelUsed: modelOverride || 'Gemini',
                taskType: taskType || 'GENERAL',
                inputSummary: "Parse Error",
                classification: DecisionClassification.ADVISE,
                confidence: 50,
                riskLevel: RiskLevel.LOW,
                reasoning: text, // Return raw text as reasoning
                keyAssumptions: [],
                failureScenarios: [],
                actionableStep: "Review response"
            };
        }

        const aiResponse = parsed.response || parsed.reasoning || "I've processed your request.";

        // Add assistant response to history
        addToHistory(sessionId, 'assistant', aiResponse);

        return {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            response: aiResponse,
            modelUsed: modelOverride || 'Gemini',
            taskType: taskType || 'GENERAL',
            inputSummary: parsed.inputSummary || "Analysis Complete",
            classification: parsed.classification || DecisionClassification.ADVISE,
            confidence: parsed.confidence || 75,
            riskLevel: parsed.riskLevel || RiskLevel.LOW,
            reasoning: parsed.reasoning || "",
            keyAssumptions: parsed.keyAssumptions || [],
            failureScenarios: parsed.failureScenarios || [],
            actionableStep: parsed.actionableStep
        };

    } catch (error: any) {
        console.error("[OPENROUTER] Analysis Failed:", error.message);
        throw error;
    }
};

// --- Audio Transcription (using Whisper via OpenRouter) ---
export const transcribeAudio = async (audioBase64: string, mimeType: string = "audio/webm"): Promise<string> => {
    // OpenRouter doesn't support direct audio transcription
    // Return a message indicating this
    console.log("[OPENROUTER] Audio transcription not directly supported");
    return "Voice input received. Please type your command.";
};

// --- Search/Verification ---
export const verifyIntel = async (query: string): Promise<{ text: string, sources?: any[] }> => {
    const apiKey = getApiKey();

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'ZAVIO Assistant'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-exp:free',
                messages: [
                    { role: 'system', content: 'You are ZAVIO Intel. Verify facts and provide concise data points.' },
                    { role: 'user', content: `Verify this information: "${query}"` }
                ],
                temperature: 0.2,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "Verification complete.";

        return { text, sources: [] };

    } catch (error: any) {
        console.error("[OPENROUTER] Verification Failed:", error.message);
        return { text: "Verification unavailable.", sources: [] };
    }
};

// --- Text to Speech (placeholder) ---
export const speakAlert = async (text: string): Promise<string> => {
    // OpenRouter doesn't support TTS directly
    // Return empty - frontend will handle this gracefully
    console.log("[OPENROUTER] TTS not supported, alert:", text);
    return "";
};
