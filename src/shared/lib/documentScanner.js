import { recognizeText, generateStructuredJSON } from './aiClient';

/**
 * Extract readable text from an image using OpenAI vision-based API.
 * @param {Blob|File} imageFileOrBlob — Captured image blob or file
 * @returns {Promise<string>} — Extracted text
 */
export async function extractTextFromImage(imageFileOrBlob) {
    const prompt = 'Transcribe all readable text in this image exactly as written. Output plain text only, with no commentary, metadata, annotations, or formatting added. Do not wrap the response in code blocks, markdown blocks, or headers.';
    
    return await recognizeText(imageFileOrBlob, {
        provider: 'openai',
        systemPrompt: prompt
    });
}

/**
 * Parse OCR'd text to extract mathematical problems.
 * @param {string} rawText
 * @returns {Promise<Object>}
 */
export async function extractMathProblemsFromText(rawText) {
    const prompt = `You are a math worksheet parser. Analyze the following OCR text from a math worksheet and extract all mathematical problems or questions.
A math problem can be basic math, algebra (e.g., "3x + 5 = 11"), trigonometry, polynomial evaluation, or advanced/complex engineering math (like integrals, derivatives, limits, matrix calculations, differential equations).
Text to parse:
"""
${rawText}
"""`;

    const schemaDescription = `Return a JSON object matching this exact shape:
{
  "problems": [
    {
      "expression": "string containing the math expression or question (e.g. '5 + 3', '3x + 5 = 11', '\\int_0^2 x^2 dx')",
      "category": "string, exactly one of: 'basic-math', 'algebra', 'polynomial', 'trigonometry', 'calculator-expression', 'complex-math'",
      "operation": "string, exactly one of: '+', '-', '×', '÷' (optional, only for basic-math)",
      "operandA": number (optional, only for basic-math),
      "operandB": number (optional, only for basic-math)
    }
  ]
}`;

    const result = await generateStructuredJSON(prompt, schemaDescription);
    return result;
}
