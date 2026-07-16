import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import ScreenHeader from '../../shared/components/ScreenHeader';
import IconButton from '../../shared/components/IconButton';
import useProfileStore from '../../store/useProfileStore';

import TopicGrid from './components/TopicGrid';
import EntryActions from './components/EntryActions';
import BasicMathGame from './components/BasicMathGame';
import BasicMathEntry from './components/BasicMathEntry';
import EnterMathInput from './components/EnterMathInput';

export default function MathHelperScreen() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const primaryMode = useProfileStore((s) => s.primaryMode);

    // activeTopic can be 'basic-math' | 'algebra' | 'polynomial' | 'trigonometry' | 'calculator' | null
    const [activeTopic, setActiveTopic] = useState(null);

    // Basic Math sub-state machine: 'entry' | 'custom-input' | 'playing'
    const [gameStep, setGameStep] = useState('entry');
    const [activeOp, setActiveOp] = useState('+');
    const [customOperandA, setCustomOperandA] = useState(undefined);
    const [customOperandB, setCustomOperandB] = useState(undefined);
    const [entryPath, setEntryPath] = useState('operation-tile');

    // Support deep-linking by reading a topic query param on mount/update
    useEffect(() => {
        const queryTopic = searchParams.get('topic');
        if (queryTopic) {
            setActiveTopic(queryTopic);
            if (queryTopic === 'basic-math') {
                setGameStep('entry');
            }
        }
    }, [searchParams]);

    const handleSelectTopic = (topicId) => {
        setActiveTopic(topicId);
        if (topicId === 'basic-math') {
            setGameStep('entry');
            setCustomOperandA(undefined);
            setCustomOperandB(undefined);
        }
    };

    const handleBack = () => {
        if (activeTopic === 'basic-math') {
            if (gameStep === 'playing') {
                setGameStep('entry');
                setCustomOperandA(undefined);
                setCustomOperandB(undefined);
            } else if (gameStep === 'custom-input') {
                setGameStep('entry');
            } else {
                setActiveTopic(null); // Return to topic-select grid
            }
        } else if (activeTopic) {
            setActiveTopic(null); // Return to topic-select grid
        } else {
            navigate('/dashboard'); // Exit to dashboard
        }
    };

    const getScreenTitle = () => {
        if (activeTopic === 'basic-math') {
            if (gameStep === 'custom-input') return 'Custom Problem';
            if (gameStep === 'playing') return 'Practice Chalkboard';
            return 'Basic Math';
        }
        return 'Math Helper';
    };

    const rightAction = (
        <IconButton
            icon={Settings}
            label="Settings"
            onClick={() => navigate('/settings')}
        />
    );

    const isLowVision = primaryMode === 'lowVision';

    return (
        <div className={`flex-1 flex flex-col min-h-screen ${isLowVision ? 'bg-gray-950 text-white' : 'bg-white dark:bg-gray-900'}`}>
            {/* Header with back arrow, screen title, and settings gear */}
            <ScreenHeader
                title={getScreenTitle()}
                onBack={handleBack}
                showBack={true}
                rightAction={rightAction}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col px-4 py-5 overflow-y-auto pb-24 max-w-[420px] mx-auto w-full justify-between gap-6">
                {activeTopic === 'basic-math' ? (
                    <>
                        {gameStep === 'entry' && (
                            <BasicMathEntry 
                                onSelectOperation={(op) => {
                                    setActiveOp(op);
                                    setCustomOperandA(undefined);
                                    setCustomOperandB(undefined);
                                    setEntryPath('operation-tile');
                                    setGameStep('playing');
                                }}
                                onSelectEnterMath={() => {
                                    setGameStep('custom-input');
                                }}
                            />
                        )}
                        {gameStep === 'custom-input' && (
                            <EnterMathInput 
                                onSubmit={({ operandA, operandB, operation }) => {
                                    setActiveOp(operation);
                                    setCustomOperandA(operandA);
                                    setCustomOperandB(operandB);
                                    setEntryPath('custom');
                                    setGameStep('playing');
                                }}
                            />
                        )}
                        {gameStep === 'playing' && (
                            <BasicMathGame 
                                operation={activeOp}
                                operandA={customOperandA}
                                operandB={customOperandB}
                                entryPath={entryPath}
                            />
                        )}
                    </>
                ) : (
                    <>
                        <div className="flex flex-col gap-4">
                            {/* Guidance / Instruction block */}
                            <div className="flex flex-col gap-1">
                                <h2 className="text-base-md font-bold text-gray-800 dark:text-gray-100">
                                    Choose a Math Topic
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
                                    Select one of the topics below to start solving and learning, or scan a paper worksheet directly.
                                </p>
                            </div>

                            {/* 5-Tile Grid Layout */}
                            <TopicGrid
                                activeTopic={activeTopic}
                                onSelectTopic={handleSelectTopic}
                            />
                        </div>

                        {/* Scan / Upload action buttons row */}
                        <EntryActions />
                    </>
                )}
            </div>
        </div>
    );
}


