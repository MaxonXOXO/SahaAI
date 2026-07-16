import { Keyboard, Plus, Minus, X, Divide } from 'lucide-react';
import Card from '../../../shared/components/Card';

export default function BasicMathEntry({ onSelectOperation, onSelectEnterMath }) {
    const tiles = [
        {
            id: 'addition',
            label: 'Addition',
            icon: Plus,
            color: 'bg-green-500',
            gridSpan: 'col-span-2',
            operation: '+'
        },
        {
            id: 'subtraction',
            label: 'Subtraction',
            icon: Minus,
            color: 'bg-red-500',
            gridSpan: 'col-span-2',
            operation: '-'
        },
        {
            id: 'multiplication',
            label: 'Multiplication',
            icon: X,
            color: 'bg-orange-500',
            gridSpan: 'col-span-3',
            operation: '*'
        },
        {
            id: 'division',
            label: 'Division',
            icon: Divide,
            color: 'bg-teal-500',
            gridSpan: 'col-span-3',
            operation: '/'
        }
    ];

    return (
        <div className="flex flex-col gap-5 w-full">
            {/* Context Header */}
            <div className="flex flex-col gap-1">
                <h3 className="text-base-md font-bold text-gray-800 dark:text-gray-150">
                    Basic Arithmetic Practice
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
                    Practice with generated stories, or enter your own custom math problem to visualize the steps.
                </p>
            </div>

            {/* Grid Layout (6 columns total) */}
            <div className="grid grid-cols-6 gap-3">
                {/* 1. Enter Math prominent tile */}
                <Card
                    onClick={onSelectEnterMath}
                    className="col-span-2 !border-primary border-2 bg-primary/5 hover:bg-primary/10 shadow-sm cursor-pointer select-none transition-all"
                >
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-3 shadow-sm">
                            <Keyboard className="text-white w-6 h-6" />
                        </div>
                        <span className="text-xs font-black text-primary uppercase tracking-wide">
                            Enter Math
                        </span>
                    </div>
                </Card>

                {/* 2. Operations Tiles */}
                {tiles.map((tile) => {
                    const IconComponent = tile.icon;
                    return (
                        <Card
                            key={tile.id}
                            onClick={() => onSelectOperation(tile.operation)}
                            className={`
                                ${tile.gridSpan}
                                hover:border-gray-200 dark:hover:border-gray-800 select-none cursor-pointer transition-all
                            `}
                        >
                            <div className="flex flex-col items-center justify-center py-4 text-center">
                                <div className={`w-12 h-12 rounded-full ${tile.color} flex items-center justify-center mb-3 shadow-sm`}>
                                    <IconComponent className="text-white w-6 h-6" />
                                </div>
                                <span className="text-xs font-bold text-gray-850 dark:text-gray-100">
                                    {tile.label}
                                </span>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
