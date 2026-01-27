/**
 * Image Service - FLUX Pro Image Generation
 * Uses OpenRouter's FLUX models for actual image generation
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Valid OpenRouter image generation models
const IMAGE_MODELS = {
    'flux-pro': 'black-forest-labs/flux.2-pro',
    'flux-flex': 'black-forest-labs/flux.2-flex',
    'flux-max': 'black-forest-labs/flux.2-max',
    'flux-klein': 'black-forest-labs/flux.2-klein-4b'
};

/**
 * Generate image using FLUX model via OpenRouter
 */
export const generateImage = async (prompt: string, apiKey: string): Promise<any> => {
    console.log('[IMAGE SERVICE] Generating image with FLUX.2 Pro...');
    console.log('[IMAGE SERVICE] Prompt:', prompt);

    // Use FLUX.2 Pro for high-quality image generation
    const modelId = IMAGE_MODELS['flux-pro'];

    try {
        // Create enhanced prompt for better results
        const enhancedPrompt = `Create a high-quality, detailed image: ${prompt}. Style: photorealistic, 8K quality, professional lighting, sharp details.`;

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'ZAVIO Assistant'
            },
            body: JSON.stringify({
                model: modelId,
                messages: [{
                    role: 'user',
                    content: enhancedPrompt
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[IMAGE SERVICE] API Error:', errorData);

            // Check if it's a rate limit or model error
            if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please try again in a moment.');
            }
            if (response.status === 402) {
                throw new Error('Insufficient credits for image generation.');
            }
            if (response.status === 400) {
                // Model not available, try fallback
                console.log('[IMAGE SERVICE] Primary model unavailable, trying fallback...');
                return await generateWithFallback(prompt, apiKey);
            }
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('[IMAGE SERVICE] Raw Response received');

        // Extract image URL from various possible response formats
        let imageUrl = extractImageUrl(data);

        if (imageUrl) {
            console.log('[IMAGE SERVICE] Image URL found:', imageUrl.substring(0, 100) + '...');
            return {
                success: true,
                imageUrl,
                prompt,
                model: 'FLUX.2 Pro'
            };
        }

        // If no image URL, try fallback
        console.log('[IMAGE SERVICE] No image URL in response, trying fallback...');
        return await generateWithFallback(prompt, apiKey);

    } catch (error: any) {
        console.error('[IMAGE SERVICE] Generation failed:', error.message);

        // Try fallback
        try {
            return await generateWithFallback(prompt, apiKey);
        } catch (fallbackError: any) {
            console.error('[IMAGE SERVICE] Fallback also failed:', fallbackError.message);
            return createFallbackResponse(prompt, error.message);
        }
    }
};

/**
 * Extract image URL from various response formats
 */
const extractImageUrl = (data: any): string | null => {
    // Check for image in message content
    const content = data.choices?.[0]?.message?.content;
    if (content) {
        if (typeof content === 'string') {
            // Check if it's a URL
            if (content.startsWith('http')) {
                return content.trim();
            }
            // Check for markdown image
            const urlMatch = content.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
            if (urlMatch) {
                return urlMatch[1];
            }
            // Check for plain URL
            const plainUrlMatch = content.match(/(https?:\/\/[^\s]+\.(png|jpg|jpeg|webp|gif))/i);
            if (plainUrlMatch) {
                return plainUrlMatch[1];
            }
        } else if (Array.isArray(content)) {
            // Handle array content format
            for (const item of content) {
                if (item.type === 'image_url' && item.image_url?.url) {
                    return item.image_url.url;
                }
                if (item.type === 'image' && item.url) {
                    return item.url;
                }
            }
        }
    }

    // Check data array format
    if (data.data?.[0]?.url) {
        return data.data[0].url;
    }

    // Check for base64 image
    if (data.data?.[0]?.b64_json) {
        return `data:image/png;base64,${data.data[0].b64_json}`;
    }

    return null;
};

/**
 * Fallback using FLUX Klein (faster, cheaper)
 */
const generateWithFallback = async (prompt: string, apiKey: string): Promise<any> => {
    console.log('[IMAGE SERVICE] Trying FLUX.2 Klein fallback...');

    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'ZAVIO Assistant'
        },
        body: JSON.stringify({
            model: IMAGE_MODELS['flux-klein'],
            messages: [{
                role: 'user',
                content: prompt
            }]
        })
    });

    if (!response.ok) {
        throw new Error(`Fallback failed: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = extractImageUrl(data);

    if (imageUrl) {
        return {
            success: true,
            imageUrl,
            prompt,
            model: 'FLUX.2 Klein'
        };
    }

    throw new Error('No image in fallback response');
};

/**
 * Create fallback response with prompt for external tools
 */
const createFallbackResponse = (prompt: string, errorMessage: string): any => {
    return {
        success: false,
        error: errorMessage,
        prompt: prompt,
        fallbackMessage: `Image generation is temporarily unavailable. Here is your refined prompt for use with external tools:

**Enhanced Prompt for Midjourney/DALL-E/Stable Diffusion:**

\`\`\`
${prompt}, photorealistic, 8K quality, professional lighting, sharp details, award-winning composition
\`\`\`

**Negative Prompt:**
\`\`\`
blurry, low quality, distorted, pixelated, watermark, text overlay
\`\`\``
    };
};
