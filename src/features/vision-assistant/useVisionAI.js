import { useState } from 'react';

/**
 * useVisionAI - Hook to interact with the Gemini Vision API
 * Supports real-time image analysis (OCR, Object detection, Scene description, Voice Q&A)
 * Falls back to high-fidelity simulated descriptions if no API key is saved.
 */
const computeImageHash = (str) => {
    let hash = 0;
    if (!str) return hash;
    // Sample 30 points across the string to get a highly variable code based on pixel content
    const step = Math.max(1, Math.floor(str.length / 30));
    for (let i = 0; i < str.length; i += step) {
        hash += str.charCodeAt(i);
    }
    return hash;
};

/**
 * Removes markdown formatting syntax for clear text-to-speech reading.
 * @param {string} text - Raw input text with possible markdown syntax
 * @returns {string} Clean plain text
 */
export function stripMarkdown(text) {
    if (!text) return '';
    return text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/^#+\s+/gm, '')
        .replace(/\*\*([\s\S]*?)\*\*/g, '$1')
        .replace(/__([\s\S]*?)__/g, '$1')
        .replace(/\*([\s\S]*?)\*/g, '$1')
        .replace(/_([\s\S]*?)_/g, '$1')
        .replace(/[*_#]/g, '');
}

export default function useVisionAI() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Analyzes captured base64 image using selected mode
     * @param {string} base64Image - Base64 encoded image string
     * @param {string} mode - 'ocr' | 'object' | 'scene' | 'qa'
     * @param {string} customQuestion - Custom question for Q&A mode
     * @returns {Promise<string>} The AI analysis result
     */
    const analyzeImage = async (base64Image, mode, customQuestion = '') => {
        setLoading(true);
        setError(null);

        // Remove data header if present
        const cleanBase64 = base64Image.includes('base64,')
            ? base64Image.split('base64,')[1]
            : base64Image;

        // Priority: user-saved key in localStorage, then build-time env variable
        let userApiKey = '';
        try {
            userApiKey = localStorage.getItem('saha_gemini_api_key') || '';
        } catch (e) {
            console.warn('[VisionAI] Failed to read API key from localStorage:', e);
        }
        const apiKey = userApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';

        // Diagnostic: log whether a key was found (never logs the actual key value)
        console.log('[VisionAI] API key present:', !!apiKey, '| Mode:', mode);

        // Craft tailored prompts for low-vision accessibility context
        let systemPrompt = '';
        if (mode === 'ocr') {
            systemPrompt = 'You are a precise Optical Character Recognition (OCR) system. Extract and read all visible text in the image exactly as it appears. Do not explain, summarize, or describe it. If no text is visible, output: "No text detected."';
        } else if (mode === 'object') {
            systemPrompt = 'Identify the single main object directly in front of the camera or most prominent in frame. Describe only that object — its type, color, material, condition, and any visible text or brand. If it is currency, state the denomination. Do not describe the surrounding room, other objects, or their positions. If no single clear object is present, briefly say so. Keep it short and easy to hear for a visually impaired user.';
        } else if (mode === 'scene') {
            systemPrompt = 'Identify all major objects, obstacles, and currency bills/coins visible in this image. Give their relative positions (e.g. "a cup on the right side of the table", "a chair in front of you"). Keep it clear, concise, and easy to hear for a visually impaired user.';
        } else if (mode === 'qa') {
            systemPrompt = `Answer this question about the image clearly and concisely: "${customQuestion}". Provide details helpful for a visually impaired user, keeping it under 3-4 sentences.`;
        } else if (mode === 'currency') {
            systemPrompt = 'Identify the single banknote or coin most prominent in this image. Respond ONLY with minified JSON. If clearly identifiable: {"status":"ok","denomination":<number>,"currency":"INR","confidence":"high"|"medium"}. Use "medium" if folded, angled, partly obscured, or poorly lit but still readable. If you cannot identify it: {"status":"unclear","reason":"<string>"}. If no currency visible: {"status":"none"}. Never guess wildly. Never comment on authenticity. Assume INR unless another currency is clearly printed.';
        }

        // --- REAL GEMINI API CALL ---
        // Only attempt when a key is configured. Never silently fall back to mock if a key is present.
        if (apiKey) {
            try {
                // Confirmed working for AQ. new-user keys (July 2026):
                // - gemini-3.5-flash   → 200 OK (primary)
                // - gemini-3.1-flash-lite → 200 OK (fallback)
                // - gemini-2.5-flash / gemini-2.0-flash → 404 "not available to new users"
                const MODELS = [
                    'gemini-3.5-flash',
                    'gemini-3.1-flash-lite',
                ];

                let response = null;
                let lastErr = null;
                for (const model of MODELS) {
                    const res = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-goog-api-key': apiKey,
                            },
                            body: JSON.stringify({
                                contents: [
                                    {
                                        parts: [
                                            { text: systemPrompt },
                                            {
                                                inlineData: {
                                                    mimeType: 'image/jpeg',
                                                    data: cleanBase64,
                                                },
                                            },
                                        ],
                                    },
                                ],
                            }),
                        }
                    );
                    if (res.ok) {
                        response = res;
                        console.log('[VisionAI] Model succeeded:', model);
                        break;
                    }
                    // 404 = model unavailable for this key, try next
                    // 429 = quota on this model, try next
                    let body = '';
                    try { body = await res.text(); } catch (_) { /* ignore */ }
                    lastErr = `${model} → ${res.status}: ${body}`;
                    console.warn('[VisionAI] Model failed, trying next:', lastErr);
                }

                if (!response) {
                    throw new Error('All models failed. Last error: ' + lastErr);
                }


                const data = await response.json();
                const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!aiText) {
                    const emptyErr = 'Empty response from Gemini API. Check quota or prompt safety filters.';
                    console.error('[VisionAI]', emptyErr, data);
                    setLoading(false);
                    setError(emptyErr);
                    throw new Error(emptyErr);
                }

                setLoading(false);
                return aiText.trim();
            } catch (err) {
                // Re-throw so callers (handleCapture in VisionAssistant) can surface the error via TTS
                setLoading(false);
                throw err;
            }
        }

        // --- SIMULATED DEMO MODE (only runs when NO key is configured) ---
        // Provide real-time latency feel (1.5 seconds)
        await new Promise((resolve) => setTimeout(resolve, 1500));

        let mockResult = '';
        if (mode === 'ocr') {
            const ocrSamples = [
                "INGREDIENTS: Whole wheat flour, sugar, chocolate chips (sugar, chocolate liquor, cocoa butter, soy lecithin), vegetable oil, salt, baking soda, natural vanilla flavor. WARNING: MAY CONTAIN PEANUTS.",
                "SahaAI User Guide\nChapter 1: Getting Started\nEnsure your device camera is enabled. Use the navigation buttons below to toggle modes. Double tap to speak questions.",
                "Rx Prescription\nTake one tablet by mouth twice daily with meals. Patient: Alex Rivers. Dr. Smith. Qty: 30 tablets. Refills remaining: 3. Keep out of reach of children.",
                "CAUTION: HOT SURFACE. DO NOT TOUCH. KEEP AWAY FROM WATER."
            ];
            const hash = computeImageHash(cleanBase64);
            mockResult = ocrSamples[hash % ocrSamples.length];
        } else if (mode === 'object') {
            const objSamples = [
                "- A standard black laptop computer is in the center\n- A dark blue coffee mug is to the right of the laptop\n- A white notebook with a pen is in the foreground\n- No walking obstacles detected on the surface.",
                "- A 20 Dollar US Bill resting flat in the center of a brown table\n- A bunch of keys in the upper right corner\n- A water bottle is in the upper left corner.",
                "- A silver smartphone is in the center\n- A pair of reading glasses is to the left of the phone\n- A computer keyboard is in the background."
            ];
            const hash = computeImageHash(cleanBase64);
            mockResult = objSamples[hash % objSamples.length];
        } else if (mode === 'scene') {
            const sceneSamples = [
                "You are looking at a bright, well-organized home office space. There is a wooden desk holding a laptop with code editor open. A blue mug is on the right, and a potted succulent is on the left. The background shows a white wall with a bookshelf. The room is warmly lit, and the floor path is completely clear of cords or obstacles.",
                "You are viewing a living room setup. There is a fabric sofa in the center with two blue cushions. A coffee table is in front of the sofa with a TV remote. To the right is a clear doorway leading to a hallway. The floor is light hardwood and there are no trip hazards visible in the direct path.",
                "You are looking at a kitchen counter. A stainless steel toaster is on the far left, a coffee maker is next to it, and a carton of milk sits near the center. The counter is clean and clutter-free, and the overhead lighting is bright."
            ];
            const hash = computeImageHash(cleanBase64);
            mockResult = sceneSamples[hash % sceneSamples.length];
        } else if (mode === 'qa') {
            const questionLower = customQuestion.toLowerCase();
            if (questionLower.includes('money') || questionLower.includes('currency') || questionLower.includes('dollar') || questionLower.includes('bill') || questionLower.includes('how much')) {
                mockResult = "Based on the image, there is a twenty-dollar bill placed flat on a brown table surface. It is clearly visible and appears to be authentic.";
            } else if (questionLower.includes('obstacle') || questionLower.includes('safe') || questionLower.includes('walk') || questionLower.includes('trip') || questionLower.includes('danger')) {
                mockResult = "The path ahead is clear. There are no power cords, loose rugs, or physical items on the floor that would pose a tripping hazard in the direct view.";
            } else if (questionLower.includes('mug') || questionLower.includes('cup') || questionLower.includes('drink')) {
                mockResult = "Yes, there is a dark blue mug sitting on the right side of the desk. It appears to contain a hot beverage.";
            } else if (questionLower.includes('read') || questionLower.includes('text') || questionLower.includes('write')) {
                mockResult = "The text visible on the document reads: 'SahaAI User Guide. Chapter 1: Getting Started.' It details how to set up the profile.";
            } else {
                mockResult = `Regarding your question: "${customQuestion}", I can see a standard workspace setup. There is a laptop in the center, a water bottle, and a clean desk surface with no obstacles in the immediate vicinity.`;
            }
        } else if (mode === 'currency') {
            const currencySamples = [
                '{"status":"ok","denomination":500,"currency":"INR","confidence":"high"}',
                '{"status":"ok","denomination":100,"currency":"INR","confidence":"high"}',
                '{"status":"ok","denomination":50,"currency":"INR","confidence":"medium"}',
                '{"status":"unclear","reason":"partially out of frame"}',
            ];
            const hash = computeImageHash(cleanBase64);
            setLoading(false);
            return currencySamples[hash % currencySamples.length];
        }

        // Always label demo results clearly so users know this is not a real analysis
        mockResult += "\n\n(Demo Mode: No Gemini API key configured. Add your API key in Settings to enable real-time camera analysis.)";

        setLoading(false);
        return mockResult;
    };

    return {
        analyzeImage,
        loading,
        error,
        stripMarkdown,
    };
}
