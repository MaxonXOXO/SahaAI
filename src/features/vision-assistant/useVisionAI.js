import { useState } from 'react';
import { supabase } from '../../shared/lib/supabaseClient';

export function stripMarkdown(text) {
    if (!text) return '';
    return text.replace(/```[\s\S]*?```/g, '').replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/^#+\s+/gm, '').replace(/\*\*([\s\S]*?)\*\*/g, '$1').replace(/[*_#]/g, '');
}

const prompts = {
    ocr: 'You are a precise OCR system. Extract and read all visible text exactly as it appears. Do not explain. If no text is visible, say "No text detected."',
    object: 'Identify the single main object in view. Briefly state its type, colour, material, condition, and visible text. Keep it easy to hear for a visually impaired user.',
    scene: 'Describe the major objects and immediate obstacles visible. Give their relative positions. Be concise and practical for a visually impaired user.',
    currency: 'Identify the most prominent banknote or coin. Return only minified JSON: {"status":"ok"|"unclear"|"none","denomination":number,"currency":"INR","confidence":"high"|"medium","reason":"optional"}. Never guess.',
};

export default function useVisionAI() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const analyzeImage = async (base64Image, mode, customQuestion = '') => {
        setLoading(true); setError(null);
        const image = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
        const prompt = mode === 'qa'
            ? `Answer this question about the image clearly in no more than four sentences: ${customQuestion}. Include details useful for a visually impaired user.`
            : prompts[mode] || prompts.scene;
        try {
            const { data, error: invokeError } = await supabase.functions.invoke('api-gateway', { body: { action: 'vision', payload: { image, prompt } } });
            if (invokeError || data?.error || !data?.text) throw new Error(data?.error || invokeError?.message || 'No vision response was returned.');
            return data.text.trim();
        } catch (err) {
            setError(err.message || 'Could not analyze this image.');
            throw err;
        } finally { setLoading(false); }
    };

    return { analyzeImage, loading, error, stripMarkdown };
}
