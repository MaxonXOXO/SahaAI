import { generateStructuredJSON } from '../../../shared/lib/aiClient';
import { evaluate } from 'mathjs';
import { solveAlgebraEquation } from './generateAlgebraProblem';
import { solvePolynomialEvaluation } from './generatePolynomialProblem';
import { solveTrigRightTriangle } from './generateTrigProblem';

/**
 * Solves a user-submitted math problem.
 * Utilizes local computation where applicable and prompts AI for explanation.
 */
export async function solveProblem(userText, selectedCategory = 'auto-detect') {
    if (!userText || userText.trim().length === 0) {
        return { error: "Please enter a math problem to solve." };
    }

    // Step 1: Query the AI to classify and parse parameters
    const classificationPrompt = `Analyze the following math problem:
"${userText}"

Selected category constraint: "${selectedCategory}". If the category is NOT "auto-detect", try your best to interpret the problem under that selected category.

Classify the problem into one of these categories:
- 'basic-math' (simple arithmetic word problem, e.g. "Emma has 5 apples and gets 2 more")
- 'algebra' (solving simple linear equations in the form ax + b = c)
- 'polynomial' (evaluating quadratic function ax² + bx + c at a given x point)
- 'trigonometry' (right-triangle Pythagorean theorem side lengths)
- 'calculator-expression' (plain mathematical expression like "2 * (3 + 4)")
- 'complex-math' (advanced or engineering-level math: calculus, integration, derivatives, matrix algebra, differential equations, complex numbers, transforms, or higher-level equations)
- 'unsupported' (non-math, purely conversational text, or completely ambiguous query)

Extract relevant parameters:
- For 'basic-math': extract operandA, operandB, and operation ('+', '-', '*', '/').
- For 'algebra': extract a, b, and c for ax + b = c.
- For 'polynomial': extract a, b, c, and x for evaluating f(x) = ax² + bx + c at x.
- For 'trigonometry': extract sideA, sideB, sideC, and missingSide ('a', 'b', or 'c').
- For 'calculator-expression': extract clean mathematical expression.`;

    const schemaDescription = `Return a JSON object matching this exact shape:
{
  "category": "basic-math" | "algebra" | "polynomial" | "trigonometry" | "calculator-expression" | "complex-math" | "unsupported",
  "basicMathParams": { "operandA": number, "operandB": number, "operation": "+" | "-" | "*" | "/" } (optional),
  "algebraParams": { "a": number, "b": number, "c": number } (optional),
  "polynomialParams": { "a": number, "b": number, "c": number, "x": number } (optional),
  "trigParams": { "sideA": number, "sideB": number, "sideC": number, "missingSide": "a" | "b" | "c" } (optional),
  "calculatorExpression": "string" (optional)
}`;

    let parsed = null;
    try {
        parsed = await generateStructuredJSON(classificationPrompt, schemaDescription);
    } catch (e) {
        console.error('[Solver] Classification error:', e);
    }

    if (!parsed || !parsed.category) {
        return { error: "Couldn't confidently solve this — try rephrasing or selecting a category." };
    }

    let finalCategory = selectedCategory !== 'auto-detect' ? selectedCategory : parsed.category;
    let finalAnswer = null;

    // Step 2: Route directly to type-specific local solving logic
    try {
        if (finalCategory === 'basic-math' && parsed.basicMathParams) {
            const { operandA, operandB, operation } = parsed.basicMathParams;
            if (operation === '+') finalAnswer = operandA + operandB;
            else if (operation === '-') finalAnswer = operandA - operandB;
            else if (operation === '*') finalAnswer = operandA * operandB;
            else if (operation === '/') {
                if (operandB === 0) throw new Error("Division by zero");
                finalAnswer = parseFloat((operandA / operandB).toFixed(2));
            } else {
                throw new Error("Invalid basic math operation");
            }
        } 
        else if (finalCategory === 'algebra' && parsed.algebraParams) {
            const { a, b, c } = parsed.algebraParams;
            finalAnswer = solveAlgebraEquation(a, b, c);
        } 
        else if (finalCategory === 'polynomial' && parsed.polynomialParams) {
            const { a, b, c, x } = parsed.polynomialParams;
            finalAnswer = solvePolynomialEvaluation(a, b, c, x);
        } 
        else if (finalCategory === 'trigonometry' && parsed.trigParams) {
            const { sideA, sideB, sideC, missingSide } = parsed.trigParams;
            const solved = solveTrigRightTriangle(sideA, sideB, sideC, missingSide);
            finalAnswer = solved.answer;
        } 
        else if (finalCategory === 'calculator-expression' && parsed.calculatorExpression) {
            let cleanExpr = parsed.calculatorExpression
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/−/g, '-');
            const val = evaluate(cleanExpr);
            if (val === undefined || val === null || isNaN(val) || val === Infinity || val === -Infinity) {
                throw new Error("Invalid calculator expression result");
            }
            finalAnswer = Number.isInteger(val) ? val : parseFloat(val.toFixed(4));
        }
    } catch (solveErr) {
        console.error('[Solver] Local solver route failed:', solveErr);
    }

    // Step 3: Fallback solving if local solver does not apply or fails
    if (finalAnswer === null) {
        if (finalCategory === 'unsupported') {
            return { error: "Couldn't confidently solve this — try rephrasing or selecting a category." };
        }

        // Consolidated AI Math Solver Flow for complex-math or fallback
        try {
            const aiSolvePrompt = `You are an expert mathematics engine. Solve the following mathematics problem step-by-step:
"${userText}"

Show all intermediate mathematical calculations and steps clearly. Write a friendly, child-friendly explanation for the steps.`;

            const aiSolveSchema = `Return a JSON object matching this exact shape:
{
  "canSolve": boolean,
  "answer": "string containing the final answer (can use standard symbols or LaTeX)",
  "steps": [
    { "description": "String explaining step 1 and showing calculations" },
    { "description": "String explaining step 2 and showing calculations" }
  ],
  "summary": "string explaining the final result briefly"
}`;

            const aiRes = await generateStructuredJSON(aiSolvePrompt, aiSolveSchema);
            if (aiRes && aiRes.canSolve && aiRes.answer !== undefined && Array.isArray(aiRes.steps) && aiRes.steps.length > 0) {
                return {
                    answer: aiRes.answer,
                    steps: aiRes.steps,
                    summary: aiRes.summary || `The final answer is ${aiRes.answer}.`,
                    category: finalCategory
                };
            } else {
                return { error: "Couldn't confidently solve this advanced problem — try rephrasing or selecting a category." };
            }
        } catch (err) {
            console.error('[Solver] Advanced AI solver failed:', err);
            return { error: "Failed to solve this advanced problem. Please check your query and try again." };
        }
    }

    // Step 4: Always prefer local/verified computation; prompt AI for steps using correct computed answer
    let steps = [];
    let summary = '';
    try {
        const explainPrompt = `Explain step-by-step how to solve this math problem: "${userText}"
The mathematically computed correct final answer is EXACTLY: ${finalAnswer}.
Write a simple, child-friendly explanation showing the calculations. Make sure not to contradict this final answer.`;

        const explainSchema = `Return a JSON object matching this exact shape:
{
  "steps": [
    { "description": "String explaining step 1" },
    { "description": "String explaining step 2" }
  ],
  "summary": "String summarizing the final result."
}`;

        const rawExplain = await generateStructuredJSON(explainPrompt, explainSchema);
        if (rawExplain && Array.isArray(rawExplain.steps) && rawExplain.steps.length > 0) {
            steps = rawExplain.steps;
            summary = rawExplain.summary || `The final answer is ${finalAnswer}.`;
        } else {
            steps = [{ description: `Solve the problem to arrive at the final answer: ${finalAnswer}.` }];
            summary = `Final answer is ${finalAnswer}.`;
        }
    } catch (e) {
        console.error('[Solver] Step explanation generation failed:', e);
        steps = [{ description: `Solve the problem to arrive at the final answer: ${finalAnswer}.` }];
        summary = `Final answer is ${finalAnswer}.`;
    }

    return {
        answer: finalAnswer,
        steps,
        summary,
        category: finalCategory
    };
}
