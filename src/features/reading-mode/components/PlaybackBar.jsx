import { Play, Pause, Square, Volume2 } from 'lucide-react';

/**
 * PlaybackBar Component
 * Control dock showing playing states, audio speeds, and a progress line.
 * Leverages touch targets and design tokens.
 */
export default function PlaybackBar({
    isPlaying = false,
    onPlayPause,
    onStop,
    progress = 30, // Default visual progress percentage
    speed = 1.0,
    onChangeSpeed
}) {
    const speeds = [0.75, 1.0, 1.25, 1.5];

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-card p-4 shadow-md flex flex-col gap-3">
            {/* Progress line indicator */}
            <div className="w-full flex flex-col gap-1">
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between text-[11px] text-gray-400 font-semibold px-0.5">
                    <span>Progress</span>
                    <span>{progress}%</span>
                </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between gap-4">
                {/* Speed Controls Toggle button */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-full">
                    {speeds.map((s) => (
                        <button
                            key={s}
                            onClick={() => onChangeSpeed && onChangeSpeed(s)}
                            className={`px-2.5 py-1 text-xs font-extrabold rounded-full transition-all ${
                                speed === s
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-gray-500 hover:text-primary dark:text-gray-400'
                            }`}
                        >
                            {s}x
                        </button>
                    ))}
                </div>

                {/* Primary play action */}
                <div className="flex items-center gap-2">
                    {onStop && (
                        <button
                            onClick={onStop}
                            disabled={!isPlaying}
                            aria-label="Stop reading"
                            className="min-h-touch min-w-touch flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 transition-colors"
                        >
                            <Square size={16} fill="currentColor" />
                        </button>
                    )}

                    <button
                        onClick={onPlayPause}
                        aria-label={isPlaying ? "Pause reading" : "Play reading"}
                        className="w-14 h-14 rounded-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                    >
                        {isPlaying ? (
                            <Pause size={24} fill="white" />
                        ) : (
                            <Play size={24} fill="white" className="ml-0.5" />
                        )}
                    </button>
                </div>

                {/* Simulated voice status */}
                <div className="flex items-center gap-1.5 text-gray-500 text-xs font-semibold">
                    <Volume2 size={16} className="text-primary" />
                    <span>English Voice</span>
                </div>
            </div>
        </div>
    );
}
