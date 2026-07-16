import { generateStructuredJSON } from '../../../shared/lib/aiClient';

// Helper to construct fallback problems dynamically (guarantees local safety)
function getDynamicFallback(operation, operandA, operandB) {
    const itemEmoji = "🍎";
    let story = "";
    let computedAnswer = 0;

    const opSymbol = operation === '*' || operation === '×' ? '*' : (operation === '/' || operation === '÷' ? '/' : operation);
    
    if (opSymbol === '+') {
        story = `Emma has ${operandA} apples, then gets ${operandB} more. How many apples does she have now?`;
        computedAnswer = operandA + operandB;
    } else if (opSymbol === '-') {
        story = `Emma has ${operandA} apples, then shares ${operandB} of them. How many apples does she have left?`;
        computedAnswer = operandA - operandB;
    } else if (opSymbol === '*') {
        story = `Emma has ${operandA} bags. Each bag has ${operandB} apples. How many apples does she have in total?`;
        computedAnswer = operandA * operandB;
    } else {
        story = `Emma has ${operandA} apples. She shares them equally into ${operandB} groups. How many apples are in each group?`;
        computedAnswer = Math.round((operandA / operandB) * 100) / 100;
    }

    // Build unique wrong choices
    const wrong = new Set();
    while (wrong.size < 3) {
        const offset = Math.floor(Math.random() * 5) + 1;
        const coin = Math.random() > 0.5 ? 1 : -1;
        const val = Math.round((computedAnswer + (coin * offset)) * 100) / 100;
        if (val !== computedAnswer && val > 0) {
            wrong.add(val);
        }
    }

    return {
        story,
        characterName: "Emma",
        operation,
        operandA,
        operandB,
        answer: computedAnswer,
        wrongChoices: Array.from(wrong),
        itemEmoji
    };
}

/**
 * Generates a validated basic math problem using OpenAI, with local computation and fallback safeguards.
 *
 * @param {Object} options - config options
 * @param {string} [options.operation] - '+', '-', '*', '/', '×', '÷'
 * @param {number} [options.operandA] - Custom first number
 * @param {number} [options.operandB] - Custom second number
 * @param {string} [options.difficulty] - 'easy' | 'medium'
 * @returns {Promise<Object>}
 */
export async function generateMathProblem({ operation = '+', operandA, operandB, difficulty = 'easy' } = {}) {
    // Standardize operation symbols
    let standardizedOp = operation;
    if (operation === '×') standardizedOp = '*';
    if (operation === '÷') standardizedOp = '/';

    // Generate random values if not user-supplied
    let finalA = operandA;
    let finalB = operandB;

    if (finalA === undefined || finalB === undefined) {
        if (standardizedOp === '/') {
            // Division constraint: always results in a clean whole number
            const divisor = Math.floor(Math.random() * 4) + 2; // divisor 2 to 5
            const quotient = Math.floor(Math.random() * (difficulty === 'easy' ? 4 : 6)) + 1; // quotient 1 to 4/6
            finalA = divisor * quotient;
            finalB = divisor;
        } else if (standardizedOp === '-') {
            // Subtraction: ensure no negative results
            const maxVal = difficulty === 'easy' ? 5 : 10;
            finalA = Math.floor(Math.random() * maxVal) + 2;
            finalB = Math.floor(Math.random() * (finalA - 1)) + 1; // finalB < finalA
        } else if (standardizedOp === '*') {
            // Multiplication: small factors
            finalA = Math.floor(Math.random() * (difficulty === 'easy' ? 4 : 5)) + 1;
            finalB = Math.floor(Math.random() * (difficulty === 'easy' ? 4 : 5)) + 1;
        } else {
            // Addition
            const maxVal = difficulty === 'easy' ? 5 : 10;
            finalA = Math.floor(Math.random() * maxVal) + 1;
            finalB = Math.floor(Math.random() * maxVal) + 1;
        }
    }

    // CRITICAL: Always compute the correct answer locally in JS
    let computedAnswer = 0;
    if (standardizedOp === '+') computedAnswer = finalA + finalB;
    else if (standardizedOp === '-') computedAnswer = finalA - finalB;
    else if (standardizedOp === '*') computedAnswer = finalA * finalB;
    else if (standardizedOp === '/') {
        computedAnswer = Math.round((finalA / finalB) * 100) / 100;
    }

    const prompt = `Write a simple children's word story problem where characterName starts with ${finalA} items and operation is "${operation}" with ${finalB} items.
The mathematically computed answer is exactly ${computedAnswer}.
Write a friendly, relatable short story.`;

    const schemaDescription = `Return a JSON object matching this exact shape:
{
  "story": "string containing the simple word problem story (e.g. 'Emma has ${finalA} cookies. She gives ${finalB} to her brother. How many are left?')",
  "characterName": "string of the character's name in the story",
  "wrongChoices": [number, number, number] (three unique incorrect numbers close to the answer ${computedAnswer}, must NOT contain the correct answer),
  "itemEmoji": "string, a single countable emoji representing the items in the story (e.g. '🍎', '🍪', '⭐', '🎈')"
}`;

    // Helper to sanitize/validate choices locally to avoid unnecessary API retries
    const cleanAndFinalizeResponse = (rawObj) => {
        if (!rawObj || typeof rawObj.story !== 'string') return null;

        // Clean wrong choices
        let rawWrong = Array.isArray(rawObj.wrongChoices) ? rawObj.wrongChoices : [];
        let uniqueWrong = new Set(
            rawWrong
                .map(x => Number(x))
                .filter(x => !isNaN(x) && x !== computedAnswer && x > 0)
        );

        // Fill up to 3 if AI returned collisions or invalid numbers
        while (uniqueWrong.size < 3) {
            const offset = Math.floor(Math.random() * 5) + 1;
            const coin = Math.random() > 0.5 ? 1 : -1;
            const val = Math.round((computedAnswer + (coin * offset)) * 100) / 100;
            if (val !== computedAnswer && val > 0) {
                uniqueWrong.add(val);
            }
        }

        return {
            story: rawObj.story,
            characterName: rawObj.characterName || "Emma",
            operation: standardizedOp,
            operandA: finalA,
            operandB: finalB,
            answer: computedAnswer,
            wrongChoices: Array.from(uniqueWrong),
            itemEmoji: rawObj.itemEmoji || "🍎"
        };
    };

    // Attempt 1
    try {
        const rawResponse = await generateStructuredJSON(prompt, schemaDescription);
        const finalized = cleanAndFinalizeResponse(rawResponse);
        if (finalized) return finalized;
    } catch (e) {
        console.error('[Math Generator] OpenAI structured request error 1:', e);
    }

    // Attempt 2
    try {
        const rawResponse = await generateStructuredJSON(prompt + ' (Be extremely careful to output exactly structured JSON matching the description)', schemaDescription);
        const finalized = cleanAndFinalizeResponse(rawResponse);
        if (finalized) return finalized;
    } catch (e) {
        console.error('[Math Generator] OpenAI structured request error 2:', e);
    }

    // Final local fallback
    console.warn('[Math Generator] AI problem generation failed twice. Using local fallback.');
    return getDynamicFallback(standardizedOp, finalA, finalB);
}
