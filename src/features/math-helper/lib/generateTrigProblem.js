import { generateStructuredJSON } from '../../../shared/lib/aiClient';

// Local fallback generator using standard Pythagorean triples
function getLocalFallback() {
    const triples = [
        { a: 3, b: 4, c: 5 },
        { a: 5, b: 12, c: 13 },
        { a: 6, b: 8, c: 10 },
        { a: 8, b: 15, c: 17 },
        { a: 9, b: 12, c: 15 }
    ];
    const triple = triples[Math.floor(Math.random() * triples.length)];
    const missingOptions = ['a', 'b', 'c'];
    const missingSide = missingOptions[Math.floor(Math.random() * missingOptions.length)];

    let story = "";
    let answer = 0;
    
    if (missingSide === 'c') {
        story = `A builder has a ladder leaning against a wall. The base of the ladder is ${triple.a} meters from the wall, and the top of the ladder reaches ${triple.b} meters high. How long is the ladder?`;
        answer = triple.c;
    } else if (missingSide === 'a') {
        story = `A slide is ${triple.c} feet long. The vertical ladder of the slide is ${triple.b} feet tall. How far is the bottom of the slide from the ladder?`;
        answer = triple.a;
    } else {
        story = `A direct path across a rectangular field is ${triple.c} yards long. The width of the field is ${triple.a} yards. What is the length of the field?`;
        answer = triple.b;
    }

    const wrong = new Set();
    while (wrong.size < 3) {
        const offset = Math.floor(Math.random() * 4) + 1;
        const coin = Math.random() > 0.5 ? 1 : -1;
        const val = answer + coin * offset;
        if (val !== answer && val > 0) {
            wrong.add(val);
        }
    }

    return {
        story,
        sideA: triple.a,
        sideB: triple.b,
        sideC: triple.c,
        missingSide,
        answer,
        wrongChoices: Array.from(wrong),
        operationEquivalent: 'right-triangle'
    };
}

export function solveTrigRightTriangle(sideA, sideB, sideC, missingSide) {
    let sA = Math.abs(Number(sideA));
    let sB = Math.abs(Number(sideB));
    let sC = Math.abs(Number(sideC));
    let mSide = missingSide;

    if (isNaN(sA) || sA <= 0) sA = 3;
    if (isNaN(sB) || sB <= 0) sB = 4;
    if (isNaN(sC) || sC <= 0) sC = 5;
    if (!['a', 'b', 'c'].includes(mSide)) mSide = 'c';

    let computedAnswer = 0;
    if (mSide === 'c') {
        computedAnswer = Math.sqrt(sA * sA + sB * sB);
    } else if (mSide === 'a') {
        if (sC <= sB) sC = sB + 2; // ensure hypotenuse is strictly larger
        computedAnswer = Math.sqrt(sC * sC - sB * sB);
    } else {
        if (sC <= sA) sC = sA + 2; // ensure hypotenuse is strictly larger
        computedAnswer = Math.sqrt(sC * sC - sA * sA);
    }

    return {
        sideA: sA,
        sideB: sB,
        sideC: sC,
        missingSide: mSide,
        answer: parseFloat(computedAnswer.toFixed(1))
    };
}

/**
 * Generates a Trigonometry Pythagorean theorem problem.
 * Solution: missingSide = sqrt(a² + b²) or rearranged form.
 */
export async function generateTrigProblem() {
    const prompt = `Write a short, engaging children's story word problem about a right-angled triangle where two side lengths are known and one side length is unknown.
Use small integer side lengths. Specify sideA (base), sideB (height), and sideC (hypotenuse) in your response, and specify which side ('a', 'b', or 'c') is the missingSide that the user needs to find.`;

    const schemaDescription = `Return a JSON object matching this exact shape:
{
  "story": "string containing the simple word problem story (e.g. 'A giant tree casts a shadow sideA=6 meters long. The distance from the tip of the shadow to the top of the tree sideC is 10 meters. How tall sideB is the tree?')",
  "sideA": number (base length, small integer),
  "sideB": number (height length, small integer),
  "sideC": number (hypotenuse length, small integer),
  "missingSide": "string: 'a', 'b', or 'c' (the side to be solved for)"
}`;

    const finalizeAndValidate = (raw) => {
        if (!raw || typeof raw.story !== 'string') return null;
        let sideA = Math.abs(Number(raw.sideA));
        let sideB = Math.abs(Number(raw.sideB));
        let sideC = Math.abs(Number(raw.sideC));
        let missingSide = raw.missingSide;

        // Use core solver to compute sanitized sides and the exact answer
        const solved = solveTrigRightTriangle(sideA, sideB, sideC, missingSide);
        const answer = solved.answer;

        // Generate 3 wrong choices locally
        const wrong = new Set();
        while (wrong.size < 3) {
            const offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 0.5 : 1);
            const coin = Math.random() > 0.5 ? 1 : -1;
            let val = answer + coin * offset;
            val = parseFloat(val.toFixed(1));
            if (val !== answer && val > 0) {
                wrong.add(val);
            }
        }

        return {
            story: raw.story,
            sideA: solved.sideA,
            sideB: solved.sideB,
            sideC: solved.sideC,
            missingSide: solved.missingSide,
            answer,
            wrongChoices: Array.from(wrong),
            operationEquivalent: 'right-triangle'
        };
    };

    try {
        const res = await generateStructuredJSON(prompt, schemaDescription);
        const finalized = finalizeAndValidate(res);
        if (finalized) return finalized;
    } catch (e) {
        console.error('[Trig Generator] AI request failed:', e);
    }

    console.warn('[Trig Generator] Falling back to local right-triangle generation.');
    return getLocalFallback();
}
