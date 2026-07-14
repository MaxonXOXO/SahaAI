import { generateSpeech } from '../../../shared/lib/aiClient';

/**
 * Fetch text-to-speech audio from OpenAI TTS.
 * @param {string} text — Text to speak
 * @param {Object} options — Speech options (voice, model)
 * @returns {Promise<Blob>} — Audio file blob
 */
export async function fetchSpeechAudio(text, options = {}) {
    return await generateSpeech(text, {
        provider: 'openai',
        voice: options.voice || 'alloy',
        ...options
    });
}

/**
 * Partition tokenized words into chunks of text for OpenAI TTS.
 * Ensures chunks do not exceed a character limit (e.g., 600 characters)
 * and split at sentence boundaries (periods, exclamation marks, question marks, newlines)
 * without splitting mid-word.
 */
export function buildSpeechChunks(words, documentText, maxChunkCharLength = 600) {
    const chunks = [];
    if (!words || words.length === 0) return chunks;

    let currentChunkWords = [];

    for (let i = 0; i < words.length; i++) {
        const w = words[i];
        currentChunkWords.push(w);

        const chunkStart = currentChunkWords[0].start;
        const chunkEnd = w.end;
        const chunkCharCount = chunkEnd - chunkStart;

        // Check if the current word ends a sentence or paragraph
        const isSentenceEnd = /[.!?](\s|$)/.test(w.word) || w.word.includes('\n');
        
        // If we exceed the target chunk length, or we hit a sentence end and have enough content,
        // or we reached the last word, close the chunk.
        if (chunkCharCount >= maxChunkCharLength || (isSentenceEnd && chunkCharCount > 200) || i === words.length - 1) {
            const chunkText = documentText.substring(chunkStart, chunkEnd);
            chunks.push({
                text: chunkText,
                words: [...currentChunkWords],
                startIndex: currentChunkWords[0].index,
                endIndex: w.index
            });
            currentChunkWords = [];
        }
    }

    // Capture any remaining words
    if (currentChunkWords.length > 0) {
        const chunkStart = currentChunkWords[0].start;
        const chunkEnd = currentChunkWords[currentChunkWords.length - 1].end;
        const chunkText = documentText.substring(chunkStart, chunkEnd);
        chunks.push({
            text: chunkText,
            words: currentChunkWords,
            startIndex: currentChunkWords[0].index,
            endIndex: currentChunkWords[currentChunkWords.length - 1].index
        });
    }

    return chunks;
}

/**
 * Distribute timing proportionally by word length.
 * @param {Array} chunkWords — List of tokenized words in the chunk
 * @param {number} duration — Actual audio duration of the chunk in seconds
 * @returns {Array} — List of words mapped with absolute chunk start/end timings
 */
export function estimateWordTimings(chunkWords, duration) {
    const totalLetters = chunkWords.reduce((sum, w) => sum + w.word.length, 0);
    if (totalLetters === 0) {
        return chunkWords.map(w => ({ ...w, startTime: 0, endTime: 0 }));
    }

    let elapsed = 0;
    return chunkWords.map((w) => {
        const wordWeight = w.word.length / totalLetters;
        const wordDuration = duration * wordWeight;
        const startTime = elapsed;
        const endTime = elapsed + wordDuration;
        elapsed = endTime;
        return {
            ...w,
            startTime,
            endTime
        };
    });
}
