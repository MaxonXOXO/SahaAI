import MathQuizEngine from './MathQuizEngine';
import { generateTrigProblem } from '../lib/generateTrigProblem';

export default function TrigonometryView() {
    const renderQuestion = (problem) => {
        const { sideA, sideB, sideC, missingSide } = problem;
        
        const labelA = missingSide === 'a' ? 'a = ?' : `a = ${sideA}`;
        const labelB = missingSide === 'b' ? 'b = ?' : `b = ${sideB}`;
        const labelC = missingSide === 'c' ? 'c = ?' : `c = ${sideC}`;

        return (
            <div className="flex flex-col items-center justify-center p-4 bg-black/15 rounded-xl border border-white/5 shadow-inner w-full max-w-[280px] select-none text-center gap-3">
                {/* SVG Right Triangle illustration */}
                <svg width="180" height="150" viewBox="0 0 180 150" className="text-[#dcedc8]">
                    {/* The right-angle triangle path */}
                    <polygon 
                        points="45,20 45,120 145,120" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3.5" 
                        strokeLinejoin="round"
                    />
                    {/* Right angle indicator indicator */}
                    <rect x="45" y="110" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    
                    {/* Labels on sides */}
                    {/* Side B (Height) - Left side */}
                    <text x="35" y="75" fill="white" className="text-xs font-black font-mono" textAnchor="end">
                        {labelB}
                    </text>
                    {/* Side A (Base) - Bottom side */}
                    <text x="95" y="138" fill="white" className="text-xs font-black font-mono" textAnchor="middle">
                        {labelA}
                    </text>
                    {/* Side C (Hypotenuse) - Diagonal */}
                    <text x="105" y="65" fill="white" className="text-xs font-black font-mono" textAnchor="start">
                        {labelC}
                    </text>
                </svg>
                <span className="text-[10px] font-bold text-[#dcedc8]/60 uppercase tracking-widest mt-1">
                    Find the missing side length
                </span>
            </div>
        );
    };

    return (
        <MathQuizEngine
            generateProblem={generateTrigProblem}
            renderQuestion={renderQuestion}
            topic="trigonometry"
        />
    );
}
