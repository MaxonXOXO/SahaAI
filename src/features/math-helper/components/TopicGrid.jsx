import { Calculator } from 'lucide-react';
import Card from '../../../shared/components/Card';

// Custom SVG Icons matching topic illustrations
function BasicMathIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Plus */}
            <path d="M5 6h4M7 4v4" />
            {/* Minus */}
            <path d="M15 6h4" />
            {/* Multiply */}
            <path d="M5 16l4 4M9 16l-4 4" />
            {/* Divide */}
            <path d="M15 18h4" />
            <circle cx="17" cy="16" r="0.75" fill="currentColor" />
            <circle cx="17" cy="20" r="0.75" fill="currentColor" />
        </svg>
    );
}

function AlgebraIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Solve for x variable concept */}
            <path d="M7 8h10" />
            <path d="M12 5v6" />
            <path d="M6 18l12-8" />
            <path d="M6 10l12 8" />
        </svg>
    );
}

function PolynomialIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Parabola curve and axes */}
            <path d="M4 12h16" />
            <path d="M12 4v16" />
            <path d="M6 6q6 14 12 0" />
        </svg>
    );
}

function TrigonometryIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Right-angle triangle and arc */}
            <path d="M5 4v15h15Z" />
            <path d="M11 19a6 6 0 0 0-6-6" />
        </svg>
    );
}

export default function TopicGrid({ activeTopic, onSelectTopic }) {
    const topics = [
        {
            id: 'basic-math',
            title: 'Basic Math',
            icon: BasicMathIcon,
            color: 'bg-green-500',
            gridSpan: 'col-span-2',
        },
        {
            id: 'algebra',
            title: 'Algebra',
            icon: AlgebraIcon,
            color: 'bg-primary',
            gridSpan: 'col-span-2',
        },
        {
            id: 'polynomial',
            title: 'Polynomial',
            icon: PolynomialIcon,
            color: 'bg-orange-500',
            gridSpan: 'col-span-2',
        },
        {
            id: 'trigonometry',
            title: 'Trigonometry',
            icon: TrigonometryIcon,
            color: 'bg-teal-500',
            gridSpan: 'col-span-3',
        },
        {
            id: 'calculator',
            title: 'Calculator',
            icon: Calculator,
            color: 'bg-indigo-500',
            gridSpan: 'col-span-3',
        }
    ];

    return (
        <div className="grid grid-cols-6 gap-3 w-full">
            {topics.map((topic) => {
                const IconComponent = topic.icon;
                const isSelected = activeTopic === topic.id;

                return (
                    <Card
                        key={topic.id}
                        onClick={() => onSelectTopic(topic.id)}
                        className={`
                            ${topic.gridSpan}
                            transition-all select-none
                            ${isSelected 
                                ? '!border-primary !border-2 shadow-md bg-primary/5 dark:bg-primary/10' 
                                : '!border-transparent hover:border-gray-200 dark:hover:border-gray-800'}
                        `}
                    >
                        <div className="flex flex-col items-center justify-center py-4 text-center">
                            {/* Icon Wrapper */}
                            <div className={`w-12 h-12 rounded-full ${topic.color} flex items-center justify-center mb-3 shadow-sm`}>
                                <IconComponent className="text-white w-6 h-6" />
                            </div>
                            
                            {/* Title */}
                            <span className="text-xs font-bold text-gray-850 dark:text-gray-100">
                                {topic.title}
                            </span>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
