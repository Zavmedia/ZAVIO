import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";

// --- Enums (mirrored from frontend types) ---
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
    inputSummary: string;
    classification: DecisionClassification;
    confidence: number;
    riskLevel: RiskLevel;
    reasoning: string;
    keyAssumptions: string[];
    failureScenarios: string[];
    actionableStep?: string;
    groundingUrls?: Array<{ title: string; uri: string }>;
}

// --- System Instructions ---
const ZAVIO_SYSTEM_INSTRUCTION = `
You are ZAVIO, a comprehensive AI companion and business strategist dedicated to your user's financial independence and success.

YOUR CORE IDENTITY:
- Analysis Model: Deep analytical thinking for business decisions, market trends, and opportunities
- Development Supporter: Technical guidance for coding, Power BI, 3D modeling, and digital tools
- Idea Generator: Creative business ideas, startup concepts, and innovation strategies
- Work Assistant: Task management, productivity optimization, and workflow automation
- Motivator: Encouraging, supportive, and focused on actionable progress
- Opportunity Finder: Actively identify jobs, freelancing gigs, business gaps, and money-making opportunities
- Financial Supporter: Budget planning, investment ideas, revenue stream development
- Market Researcher: Real-time insights on tech trends, market dynamics, fashion, and consumer behavior
- Startup Advisor: Business gap analysis, competitive research, go-to-market strategies
- Trustful Companion: Honest, reliable, and always working in the user's best interest

SPECIALIZED CAPABILITIES:
- Power BI: Dashboard design, DAX formulas, data modeling, visualization best practices
- 3D Modeling: Guidance for Blender, CAD software, asset creation for games/products
- Super Prompts: Generate highly detailed, structured prompts for AI tools (ChatGPT, Midjourney, Stable Diffusion)
- Tech Updates: Latest in AI, blockchain, automation, SaaS, and emerging technologies
- Trend Analysis: Fashion, social media, consumer behavior, and viral content patterns
- Market Intelligence: Competitor analysis, pricing strategies, demand forecasting

PRIMARY MISSION: HELP USER MAKE MONEY
- Proactively suggest freelancing opportunities (Upwork, Fiverr, Toptal)
- Identify high-demand skills and training paths
- Recommend side hustles and passive income streams
- Analyze business ideas for profitability and feasibility
- Find business gaps in local and global markets
- Create actionable plans to monetize existing skills

OPERATIONAL MODES:
- STANDBY: Passive monitoring, awaiting input
- THINKING: Reasoning and internal analysis
- ADVISORY: Providing guidance or recommendations
- ACTION_READY: Task prepared, awaiting confirmation
- EXECUTING: Performing an approved action
- ALERT: Immediate attention required

DECISION CLASSIFICATION:
- NO_ACTION: Input is noise/irrelevant
- MONITOR: Passive tracking required
- ADVISE: Strategic input available
- ALERT: Critical failure or risk imminent
- ACTION_READY: Execution path calculated
- EXECUTING: Running authorized protocol

CORE BEHAVIOR:
- Be proactive: Suggest opportunities without being asked
- Be specific: Provide exact steps, tools, and resources
- Be current: Reference latest trends, tools, and market conditions
- Be actionable: Every response should include next steps
- Remember context: Build on previous conversations
- Never use em dashes (use hyphens or commas instead)
- Never use emojis
- Use clear, structured, professional language
- Format code with proper markdown code blocks

CODE GENERATION:
- Write working code immediately when requested
- Support: Python, JavaScript, TypeScript, SQL, DAX, Pine Script, HTML/CSS
- Include comments and brief explanations
- Provide deployment/usage instructions

You exist to make the user more capable, organized, informed, effective, and financially successful.
You optimize quietly. You protect the user's time, focus, and financial future.
`;


// --- Initialization ---
const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    return new GoogleGenAI({ apiKey });
};

// --- Helper: Clean JSON ---
const cleanJsonResponse = (text: string): string => {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
        clean = clean.replace(/^```json/, '').replace(/```$/, '');
    } else if (clean.startsWith('```')) {
        clean = clean.replace(/^```/, '').replace(/```$/, '');
    }
    return clean.trim();
};

// --- Core Analysis ---
export const analyzeInput = async (
    input: string,
    domain: string,
    imageBase64?: string,
    mimeType?: string
): Promise<AnalysisResult> => {
    const ai = getAiClient();

    const fullPrompt = `
    DOMAIN: ${domain.toUpperCase()}
    INPUT: "${input}"
    
    DIRECTIVE: Analyze input. Extract intent. Calculate optimal path. Output strictly JSON.
  `;

    const parts: any[] = [{ text: fullPrompt }];

    if (imageBase64 && mimeType) {
        parts.unshift({
            inlineData: {
                data: imageBase64,
                mimeType: mimeType
            }
        });
    }

    const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            inputSummary: { type: Type.STRING, description: "Max 5 words. Technical summary." },
            classification: { type: Type.STRING, enum: Object.values(DecisionClassification) },
            confidence: { type: Type.NUMBER, description: "0 to 100" },
            riskLevel: { type: Type.STRING, enum: Object.values(RiskLevel) },
            reasoning: { type: Type.STRING, description: "Concise technical rationale. Bullet points preferred." },
            keyAssumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
            failureScenarios: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionableStep: { type: Type.STRING, description: "Command syntax required if classification is ADVISE, ACTION_READY or EXECUTING" }
        },
        required: ["inputSummary", "classification", "confidence", "riskLevel", "reasoning", "keyAssumptions", "failureScenarios"]
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: { parts },
            config: {
                systemInstruction: ZAVIO_SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from ZAVIO Core.");

        let parsed: any;
        try {
            parsed = JSON.parse(cleanJsonResponse(text));
        } catch (e) {
            console.error("[GEMINI] JSON Parse Error. Raw text:", text);
            return {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                inputSummary: "PARSE_ERROR",
                classification: DecisionClassification.ALERT,
                confidence: 0,
                riskLevel: RiskLevel.HIGH,
                reasoning: "System received malformed data. Raw Output: " + text.substring(0, 100) + "...",
                keyAssumptions: ["API Malfunction"],
                failureScenarios: ["Data Loss"],
                actionableStep: "RETRY"
            };
        }

        return {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            ...parsed
        };

    } catch (error) {
        console.error("[GEMINI] Analysis Failed:", error);
        throw error;
    }
};

// --- Audio Transcription ---
export const transcribeAudio = async (audioBase64: string, mimeType: string = "audio/webm"): Promise<string> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: audioBase64,
                            mimeType: mimeType,
                        }
                    },
                    { text: "Transcribe this audio. Output only the exact text spoken. No commentary." }
                ]
            }
        });
        return response.text || "";
    } catch (error) {
        console.error("[GEMINI] Transcription Failed:", error);
        return "";
    }
};

// --- Grounding / Search ---
export const verifyIntel = async (query: string): Promise<{ text: string, sources?: any[] }> => {
    const ai = getAiClient();

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `Verify intelligence: "${query}"`,
            config: {
                tools: [{ googleSearch: {} }],
                systemInstruction: "You are ZAVIO Intel. Verify facts. Output concise data points only."
            }
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources = groundingChunks?.map((chunk: any) => chunk.web).filter(Boolean);

        return {
            text: response.text || "Verification complete. No text output.",
            sources
        };

    } catch (error) {
        console.error("[GEMINI] Verification Failed:", error);
        return { text: "Verification Unavailable.", sources: [] };
    }
};

// --- Text to Speech ---
export const speakAlert = async (text: string): Promise<string> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Fenrir' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio generated");

        return base64Audio; // Return raw base64 for frontend to decode

    } catch (e) {
        console.error("[GEMINI] TTS Failed", e);
        throw e;
    }
};
