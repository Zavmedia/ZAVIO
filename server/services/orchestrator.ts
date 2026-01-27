// Task classification types
export enum TaskType {
    CODE = 'code',
    IMAGE_GEN = 'image_generation',
    WEB_SEARCH = 'web_search',
    ML_TRAINING = 'machine_learning',
    DOCUMENT_ANALYSIS = 'document_analysis',
    VOICE_INTERACTION = 'voice',
    GENERAL = 'general'
}

export type AIModel = 'Gemini' | 'Gemini Native Voice' | 'Qwen Coder' | 'Perplexity' | 'Nano Banana' | 'NotebookLM' | 'Gemma';

interface TaskClassification {
    taskType: TaskType;
    model: AIModel;
    confidence: number;
    reasoning: string;
}

/**
 * Orchestrator Service
 * Routes tasks to appropriate AI models based on input analysis
 */
export class OrchestratorService {

    /**
     * Classify task type and select appropriate model
     */
    static classifyTask(input: string, fileAttached: boolean = false): TaskClassification {
        const lowerInput = input.toLowerCase();

        // Code-related keywords
        const codeKeywords = ['code', 'function', 'class', 'debug', 'error', 'bug', 'syntax', 'compile', 'algorithm',
            'refactor', 'optimize', 'javascript', 'python', 'typescript', 'java', 'c++', 'rust',
            'api', 'database', 'sql', 'react', 'node', 'express', 'django', 'flask'];

        // Web search keywords
        const webKeywords = ['search', 'latest', 'news', 'verify', 'check', 'find', 'lookup', 'what is',
            'who is', 'when did', 'current', 'recent', 'today', 'now', 'real-time'];

        // Image generation keywords
        const imageKeywords = ['generate image', 'create image', 'draw', 'picture of', 'visualize',
            'illustration', 'avatar', 'logo', 'design', 'image of', 'make a picture'];

        // ML/Training keywords
        const mlKeywords = ['train model', 'machine learning', 'neural network', 'dataset', 'train',
            'model training', 'tensorflow', 'pytorch', 'sklearn'];

        // Document analysis keywords
        const docKeywords = ['analyze document', 'summarize', 'pdf', 'research', 'citations',
            'extract', 'document'];

        // Check for code task
        if (codeKeywords.some(keyword => lowerInput.includes(keyword))) {
            return {
                taskType: TaskType.CODE,
                model: 'Qwen Coder',
                confidence: 0.85,
                reasoning: 'Detected code-related keywords. Routing to Qwen Coder for specialized code intelligence.'
            };
        }

        // Check for web search
        if (webKeywords.some(keyword => lowerInput.includes(keyword))) {
            return {
                taskType: TaskType.WEB_SEARCH,
                model: 'Perplexity',
                confidence: 0.9,
                reasoning: 'Detected web search intent. Routing to Perplexity for real-time information.'
            };
        }

        // Check for image generation
        if (imageKeywords.some(keyword => lowerInput.includes(keyword))) {
            return {
                taskType: TaskType.IMAGE_GEN,
                model: 'Nano Banana',
                confidence: 0.9,
                reasoning: 'Detected image generation request. Routing to Nano Banana.'
            };
        }

        // Check for ML tasks
        if (mlKeywords.some(keyword => lowerInput.includes(keyword))) {
            return {
                taskType: TaskType.ML_TRAINING,
                model: 'Gemini', // Fallback to Gemini for ML guidance (local ML engine not implemented yet)
                confidence: 0.7,
                reasoning: 'Detected ML task. Using Gemini for guidance (local ML engine integration pending).'
            };
        }

        // Check for document analysis
        if (docKeywords.some(keyword => lowerInput.includes(keyword)) || fileAttached) {
            return {
                taskType: TaskType.DOCUMENT_ANALYSIS,
                model: 'Gemini', // NotebookLM integration pending, use Gemini for now
                confidence: 0.75,
                reasoning: 'Detected document analysis task. Using Gemini (NotebookLM integration pending).'
            };
        }

        // Default to Gemma for general tasks
        return {
            taskType: TaskType.GENERAL,
            model: 'Gemma',
            confidence: 1.0,
            reasoning: 'General conversational task. Using Gemma.'
        };
    }

    /**
     * Map AI model to OpenRouter model ID
     */
    static getOpenRouterModelId(model: AIModel): string {
        const modelMap: Record<AIModel, string> = {
            'Gemini': 'google/gemini-2.0-flash-exp:free',
            'Gemini Native Voice': 'google/gemini-2.0-flash-exp:free',
            'Qwen Coder': 'qwen/qwen3-next-80b-a3b-instruct:free',
            'Gemma': 'google/gemma-3-27b-it:free',
            'Perplexity': 'perplexity/sonar',
            'Nano Banana': 'black-forest-labs/flux.2-pro',
            'NotebookLM': 'google/gemini-2.0-flash-thinking-exp:free'
        };

        return modelMap[model] || modelMap['Gemini'];
    }

    /**
     * Check if a model is available (all models available via OpenRouter)
     */
    static isModelAvailable(model: AIModel): boolean {
        // All models are available via OpenRouter with the same API key
        return true;
    }

    /**
     * Get model - no fallback needed since all are available
     */
    static getFallbackModel(primary: AIModel): AIModel {
        return primary;
    }
}
