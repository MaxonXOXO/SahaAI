import { recognizeText } from '../../../shared/lib/aiClient';

/**
 * Transcribe readable text from an image using OpenAI vision-based API.
 * @param {Blob|File} imageFileOrBlob — Captured image blob or file
 * @returns {Promise<string>} — Extracted text
 */
export async function transcribeImageText(imageFileOrBlob) {
    const prompt = 'Transcribe all readable text in this image exactly as written. Output plain text only, with no commentary, metadata, annotations, or formatting added. Do not wrap the response in code blocks, markdown blocks, or headers.';
    
    return await recognizeText(imageFileOrBlob, {
        provider: 'openai',
        systemPrompt: prompt
    });
}
