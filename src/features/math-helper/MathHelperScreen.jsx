import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Settings, Loader2, Sparkles } from 'lucide-react';
import ScreenHeader from '../../shared/components/ScreenHeader';
import IconButton from '../../shared/components/IconButton';
import useProfileStore from '../../store/useProfileStore';

import TopicGrid from './components/TopicGrid';
import EntryActions from './components/EntryActions';
import BasicMathGame from './components/BasicMathGame';
import BasicMathEntry from './components/BasicMathEntry';
import EnterMathInput from './components/EnterMathInput';
import CalculatorView from './components/CalculatorView';
import AlgebraView from './components/AlgebraView';
import PolynomialView from './components/PolynomialView';
import TrigonometryView from './components/TrigonometryView';
import SolverModal from './components/SolverModal';
import DocumentScannerModal from '../../shared/components/DocumentScannerModal';
import { extractTextFromImage, extractMathProblemsFromText } from '../../shared/lib/documentScanner';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function MathHelperScreen() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const primaryMode = useProfileStore((s) => s.primaryMode);

    // activeTopic can be 'basic-math' | 'algebra' | 'polynomial' | 'trigonometry' | 'calculator' | null
    const [activeTopic, setActiveTopic] = useState(null);
    const [isSolverOpen, setIsSolverOpen] = useState(false);

    // Basic Math sub-state machine: 'entry' | 'custom-input' | 'playing'
    const [gameStep, setGameStep] = useState('entry');
    const [activeOp, setActiveOp] = useState('+');
    const [customOperandA, setCustomOperandA] = useState(undefined);
    const [customOperandB, setCustomOperandB] = useState(undefined);
    const [entryPath, setEntryPath] = useState('operation-tile');

    // Scanning & PDF upload states
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState(null);
    const [scannedProblems, setScannedProblems] = useState([]);
    
    const pdfInputRef = useRef(null);

    const processScannedImage = async (imageFileOrBlob) => {
        setIsScanning(true);
        setScanError(null);
        try {
            const rawText = await extractTextFromImage(imageFileOrBlob);
            if (!rawText || rawText.trim().length === 0 || !/[a-zA-Z0-9]/.test(rawText)) {
                throw new Error('No readable text could be scanned from the worksheet. Please make sure the image is clear and well-lit.');
            }

            const parsed = await extractMathProblemsFromText(rawText);
            if (!parsed || !Array.isArray(parsed.problems) || parsed.problems.length === 0) {
                throw new Error('No math problems could be parsed from the worksheet text.');
            }

            const firstProb = parsed.problems[0];
            
            // Standardize operation symbol
            let op = firstProb.operation;
            if (op === '×') op = '*';
            if (op === '÷') op = '/';

            setScannedProblems(parsed.problems);
            setEntryPath('scanned');
            setActiveOp(op);
            setCustomOperandA(firstProb.operandA);
            setCustomOperandB(firstProb.operandB);
            setGameStep('playing');
            setIsScannerOpen(false);
        } catch (err) {
            console.error('Worksheet scan error:', err);
            setScanError(err.message || 'Something went wrong during the worksheet scan.');
        } finally {
            setIsScanning(false);
        }
    };

    const handlePdfUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        setScanError(null);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            if (pdf.numPages === 0) {
                throw new Error('The selected PDF file contains no pages.');
            }

            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 2.0 });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport }).promise;

            const jpegBlob = await new Promise((resolve, reject) => {
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Failed to render PDF page to image.'));
                }, 'image/jpeg', 0.95);
            });

            await processScannedImage(jpegBlob);
        } catch (err) {
            console.error('PDF processing error:', err);
            setScanError(err.message || 'Failed to read or process the PDF worksheet.');
            setIsScanning(false);
        } finally {
            if (pdfInputRef.current) {
                pdfInputRef.current.value = '';
            }
        }
    };

    // Support deep-linking by reading a topic/tab query param on mount/update
    useEffect(() => {
        const queryTopic = searchParams.get('topic');
        const queryTab = searchParams.get('tab');

        if (queryTab) {
            if (queryTab === 'solve') {
                setActiveTopic('basic-math');
                setGameStep('custom-input');
            } else if (queryTab === 'games') {
                setActiveTopic('basic-math');
                setGameStep('entry');
            } else if (queryTab === 'steps') {
                // Map 'steps' to algebra topic
                setActiveTopic('algebra');
            }
        } else if (queryTopic) {
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
        if (activeTopic === 'algebra') return 'Algebra Board';
        if (activeTopic === 'polynomial') return 'Polynomial Evaluation';
        if (activeTopic === 'trigonometry') return 'Right Triangles';
        if (activeTopic === 'calculator') return 'Interactive Calculator';
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
                                problemsQueue={scannedProblems}
                                onQueueExhausted={() => setGameStep('entry')}
                                onEnterAnother={() => setGameStep('custom-input')}
                                onSurpriseMe={() => setEntryPath('operation-tile')}
                            />
                        )}
                    </>
                ) : activeTopic === 'calculator' ? (
                    <CalculatorView />
                ) : activeTopic === 'algebra' ? (
                    <AlgebraView />
                ) : activeTopic === 'polynomial' ? (
                    <PolynomialView />
                ) : activeTopic === 'trigonometry' ? (
                    <TrigonometryView />
                ) : (
                    <>
                        {isScanning ? (
                            <div className="flex-grow flex flex-col items-center justify-center gap-4 text-gray-500 dark:text-gray-400 py-12">
                                <Loader2 className="animate-spin text-primary" size={40} />
                                <div className="text-center">
                                    <p className="font-bold text-gray-800 dark:text-gray-100">Scanning Worksheet...</p>
                                    <p className="text-xs text-gray-400 mt-1">Reading pages and solving math problems</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {scanError && (
                                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-red-655 dark:text-red-400 font-bold text-sm">
                                            <span>⚠️ Scan Failed</span>
                                        </div>
                                        <p className="text-xs text-red-600 dark:text-red-300 leading-normal">{scanError}</p>
                                        <button 
                                            onClick={() => setScanError(null)} 
                                            className="mt-1 w-max text-xs text-primary font-bold hover:underline"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                )}

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

                                {/* Solver Banner style button */}
                                <button
                                    onClick={() => setIsSolverOpen(true)}
                                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-primary/15 to-[#1b3024]/25 border border-primary/20 dark:border-primary/45 rounded-2xl text-left hover:scale-[1.01] active:scale-[0.99] transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-sm">
                                            <Sparkles className="w-5 h-5 animate-pulse" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                                                Instant Math Solver
                                            </h3>
                                            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5 leading-normal">
                                                Solve any math problem step-by-step
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-primary font-black text-lg pr-1 group-hover:translate-x-1 transition-transform">
                                        →
                                    </span>
                                </button>

                                {/* Scan / Upload action buttons row */}
                                <EntryActions 
                                    onScanClick={() => setIsScannerOpen(true)}
                                    onUploadPDFClick={() => pdfInputRef.current?.click()}
                                />
                            </>
                        )}

                        <DocumentScannerModal 
                            isOpen={isScannerOpen}
                            onClose={() => setIsScannerOpen(false)}
                            onImageSelected={processScannedImage}
                        />

                        <input 
                            type="file"
                            ref={pdfInputRef}
                            onChange={handlePdfUpload}
                            accept="application/pdf"
                            className="hidden"
                        />
                    </>
                )}
            </div>

            {/* Solver Modal */}
            <SolverModal isOpen={isSolverOpen} onClose={() => setIsSolverOpen(false)} />
        </div>
    );
}


