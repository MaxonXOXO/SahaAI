import { generateStructuredJSON } from '../../../shared/lib/aiClient';

// Local fallback generator (guarantees integer solutions for a clean user experience)
function getLocalFallback() {
    const aOptions = [-3, -2, -1, 1, 2, 3, 4, 5];
    const a = aOptions[Math.floor(Math.random() * aOptions.length)];
    const x = Math.floor(Math.random() * 11) - 5; // integer solution from -5 to 5
    const b = Math.floor(Math.random() * 15) - 7; // -7 to 7
    const c = a * x + b;

    const opSymbol = b >= 0 ? '+' : '-';
    const equationText = `${a}x ${opSymbol} ${Math.abs(b)} = ${c}`;
    const story = `A wizard casts a spell that matches the secret formula: ${equationText}. Can you help find the secret value of x?`;

    const wrong = new Set();
    while (wrong.size < 3) {
        const offset = Math.floor(Math.random() * 4) + 1;
        const coin = Math.random() > 0.5 ? 1 : -1;
        const val = x + coin * offset;
        if (val !== x) {
            wrong.add(val);
        }
    }

    return {
        story,
        a,
        b,
        c,
        answer: x,
        wrongChoices: Array.from(wrong),
        operationEquivalent: 'linear-equation'
    };
}

export function solveAlgebraEquation(a, b, c) {
    let cleanA = Number(a);
    let cleanB = Number(b);
    let cleanC = Number(c);
    if (isNaN(cleanA) || cleanA === 0) cleanA = 1;
    if (isNaN(cleanB)) cleanB = 0;
    if (isNaN(cleanC)) cleanC = 0;
    
    const rawX = (cleanC - cleanB) / cleanA;
    return parseFloat(rawX.toFixed(2));
}

/**
 * Generates an Algebra problem ax + b = c.
 * Solution: x = (c - b) / a
 */
export async function generateAlgebraProblem() {
    const prompt = `Write a short, fun children's story word problem that sets up a simple linear equation of the form ax + b = c.
Choose small integer values for a, b, and c. The coefficient a must NOT be zero (between -5 and 5, excluding 0).
The story should ask the student to solve for the unknown variable x (e.g. 'Each box has x toys. Tom has a boxes...').`;

    const schemaDescription = `Return a JSON object matching this exact shape:
{
  "story": "string containing the simple word problem story",
  "a": number (non-zero coefficient for x, between -5 and 5, e.g. 2),
  "b": number (constant term, between -15 and 15, e.g. 3),
  "c": number (result term, between -20 and 20, e.g. 11)
}`;

    const finalizeAndValidate = (raw) => {
        if (!raw || typeof raw.story !== 'string') return null;
        let a = Number(raw.a);
        let b = Number(raw.b);
        let c = Number(raw.c);

        if (isNaN(a) || a === 0) a = 1;
        if (isNaN(b)) b = 0;
        if (isNaN(c)) c = 0;

        // ALWAYS compute solution locally
        const answer = solveAlgebraEquation(a, b, c);

        // Generate 3 wrong choices locally with small offsets
        const wrong = new Set();
        while (wrong.size < 3) {
            const offset = Math.floor(Math.random() * 4) + 1;
            const coin = Math.random() > 0.5 ? 1 : -1;
            let val = answer + coin * offset;
            val = parseFloat(val.toFixed(2));
            if (val !== answer) {
                wrong.add(val);
            }
        }

        return {
            story: raw.story,
            a,
            b,
            c,
            answer,
            wrongChoices: Array.from(wrong),
            operationEquivalent: 'linear-equation'
        };
    };

    try {
        const res = await generateStructuredJSON(prompt, schemaDescription);
        const finalized = finalizeAndValidate(res);
        if (finalized) return finalized;
    } catch (e) {
        console.error('[Algebra Generator] AI request failed:', e);
    }

    console.warn('[Algebra Generator] Falling back to local equation generation.');
    return getLocalFallback();
}
