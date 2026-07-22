import MathQuizEngine from './MathQuizEngine';
import { generatePolynomialProblem } from '../lib/generatePolynomialProblem';

export default function PolynomialView() {
    const renderQuestion = (problem) => {
        const { a, b, c, x } = problem;
        
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

        return (
            <div className="flex flex-col items-center justify-center p-4 bg-black/15 rounded-xl border border-white/5 shadow-inner min-w-[240px] select-none text-center">
                <span className="text-base font-bold text-gray-350 tracking-wide font-mono mb-1">
                    If {expression}
                </span>
                <span className="text-3xl font-black text-[#dcedc8] tracking-wider font-mono">
                    What is f({x})?
                </span>
            </div>
        );
    };

    return (
        <MathQuizEngine
            generateProblem={generatePolynomialProblem}
            renderQuestion={renderQuestion}
            topic="polynomial"
        />
    );
}
