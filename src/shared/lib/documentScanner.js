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
    const prompt = `You are a math worksheet parser. Analyze the following OCR text from a math worksheet and extract all basic math problems.
A math problem can be an explicit equation (e.g., "5 + 3 = 8", "12 - 4", "6 x 7", "20 / 5"), vertical additions or subtractions, or simple word problems/stories that describe a basic math operation (addition, subtraction, multiplication, or division) between two numbers.
Text to parse:
"""
${rawText}
"""`;

    const schemaDescription = `Return a JSON object matching this exact shape:
{
  "problems": [
    {
      "expression": "string containing the simple math expression (e.g. '5 + 3', '12 - 4', '4 × 3', '8 ÷ 2')",
      "operation": "string, exactly one of: '+', '-', '×', '÷'. Map any multiplication symbol like '*' or 'x' to '×', and division symbol like '/' to '÷'",
      "operandA": number (the first operand in the calculation),
      "operandB": number (the second operand in the calculation)
    }
  ]
}`;

    const result = await generateStructuredJSON(prompt, schemaDescription);
    return result;
}
