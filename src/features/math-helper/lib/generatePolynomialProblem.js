import { generateStructuredJSON } from '../../../shared/lib/aiClient';

// Local fallback generator for quadratic evaluation
function getLocalFallback() {
    const aOptions = [-3, -2, -1, 1, 2, 3];
    const a = aOptions[Math.floor(Math.random() * aOptions.length)];
    const b = Math.floor(Math.random() * 11) - 5; // -5 to 5
    const c = Math.floor(Math.random() * 15) - 7; // -7 to 7
    const x = Math.floor(Math.random() * 7) - 3; // -3 to 3

    const answer = a * x * x + b * x + c;

    let termA = `${a}x²`;
    if (a === 1) termA = 'x²';
    else if (a === -1) termA = '-x²';

    let termB = '';
    if (b > 0) termB = ` + ${b === 1 ? '' : b}x`;
    else if (b < 0) termB = ` - ${Math.abs(b) === 1 ? '' : Math.abs(b)}x`;
    
    let termC = '';
    if (c > 0) termC = ` + ${c}`;
    else if (c < 0) termC = ` - ${Math.abs(c)}`;
    
    const expression = `f(x) = ${termA}${termB}${termC}`;
    const story = `A magical garden grows flowers according to the formula: ${expression}. How many flowers will bloom when x = ${x}?`;

    const wrong = new Set();
    while (wrong.size < 3) {
        const offset = Math.floor(Math.random() * 6) + 1;
        const coin = Math.random() > 0.5 ? 1 : -1;
        const val = answer + coin * offset;
        if (val !== answer) {
            wrong.add(val);
        }
    }

    return {
        story,
        a,
        b,
        c,
        x,
        answer,
        wrongChoices: Array.from(wrong),
        operationEquivalent: 'polynomial-evaluation'
    };
}

export function solvePolynomialEvaluation(a, b, c, x) {
    let cleanA = Number(a);
    let cleanB = Number(b);
    let cleanC = Number(c);
    let cleanX = Number(x);
    if (isNaN(cleanA) || cleanA === 0) cleanA = 1;
    if (isNaN(cleanB)) cleanB = 0;
    if (isNaN(cleanC)) cleanC = 0;
    if (isNaN(cleanX)) cleanX = 0;
    return cleanA * cleanX * cleanX + cleanB * cleanX + cleanC;
}

/**
 * Generates a Polynomial problem f(x) = ax² + bx + c.
 * Solution: evaluates f(x) for a small integer x.
 */
export async function generatePolynomialProblem() {
    const prompt = `Write a short, simple children's story word problem that sets up a quadratic expression evaluation.
Choose small integer values for coefficients a, b, c, and evaluate point x. 
The coefficient a must NOT be zero (between -3 and 3, excluding 0).
The coefficients b, c should be between -10 and 10. The evaluation point x should be between -4 and 4.
The story should ask the student to find the value of f(x) for the given x.`;

    const schemaDescription = `Return a JSON object matching this exact shape:
{
  "story": "string containing the simple word problem story (e.g. 'A space rocket height is given by the function f(x). Find its height when x is 3.')",
  "a": number (non-zero coefficient for x², between -3 and 3, e.g. 2),
  "b": number (coefficient for x, between -10 and 10, e.g. -3),
  "c": number (constant term, between -10 and 10, e.g. 5),
  "x": number (small evaluation point, between -4 and 4, e.g. 3)
}`;

    const finalizeAndValidate = (raw) => {
        if (!raw || typeof raw.story !== 'string') return null;
        let a = Number(raw.a);
        let b = Number(raw.b);
        let c = Number(raw.c);
        let x = Number(raw.x);

        if (isNaN(a) || a === 0) a = 1;
        if (isNaN(b)) b = 0;
        if (isNaN(c)) c = 0;
        if (isNaN(x)) x = 0;

        // ALWAYS compute solution locally
        const answer = solvePolynomialEvaluation(a, b, c, x);

        // Generate 3 wrong choices locally
        const wrong = new Set();
        while (wrong.size < 3) {
            const offset = Math.floor(Math.random() * 6) + 1;
            const coin = Math.random() > 0.5 ? 1 : -1;
            const val = answer + coin * offset;
            if (val !== answer) {
                wrong.add(val);
            }
        }

        return {
            story: raw.story,
            a,
            b,
            c,
            x,
            answer,
            wrongChoices: Array.from(wrong),
            operationEquivalent: 'polynomial-evaluation'
        };
    };

    try {
        const res = await generateStructuredJSON(prompt, schemaDescription);
        const finalized = finalizeAndValidate(res);
        if (finalized) return finalized;
    } catch (e) {
        console.error('[Polynomial Generator] AI request failed:', e);
    }

    console.warn('[Polynomial Generator] Falling back to local polynomial generation.');
    return getLocalFallback();
}
