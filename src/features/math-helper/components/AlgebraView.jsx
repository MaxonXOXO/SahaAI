import MathQuizEngine from './MathQuizEngine';
import { generateAlgebraProblem } from '../lib/generateAlgebraProblem';

export default function AlgebraView() {
    const renderQuestion = (problem) => {
        const { a, b, c } = problem;
        
        let termA = `${a}x`;
        if (a === 1) termA = 'x';
        else if (a === -1) termA = '-x';

        let equation = '';
        if (b === 0) {
            equation = `${termA} = ${c}`;
        } else {
            const sign = b >= 0 ? '+' : '-';
            const absB = Math.abs(b);
            equation = `${termA} ${sign} ${absB} = ${c}`;
        }

        return (
            <div className="flex flex-col items-center justify-center p-4 bg-black/15 rounded-xl border border-white/5 shadow-inner min-w-[200px] select-none">
                <span className="text-3xl font-black text-[#dcedc8] tracking-wider font-mono">
                    {equation}
                </span>
                <span className="text-[10px] font-bold text-[#dcedc8]/60 uppercase tracking-widest mt-2">
                    Solve for x
                </span>
            </div>
        );
    };

    return (
        <MathQuizEngine
            generateProblem={generateAlgebraProblem}
            renderQuestion={renderQuestion}
            topic="algebra"
        />
    );
}
