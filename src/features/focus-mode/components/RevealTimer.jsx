import { useState, useEffect, useMemo } from 'react';

// Mulberry32 PRNG for deterministic seeded tile reveals
function mulberry32(seed) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function hashSeed(seed) {
    if (typeof seed === 'number') return seed;
    let hash = 0;
    const str = String(seed || '12345');
    for (let i = 0; i < str.length; i++) {
        hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
    }
    return hash >>> 0;
}

function getSeededTileRanks(seed, count = 60) {
    const prng = mulberry32(hashSeed(seed));
    const order = Array.from({ length: count }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
    }
    // Create rank map: rankMap[tileIndex] = position in reveal order
    const rankMap = new Array(count);
    for (let pos = 0; pos < count; pos++) {
        rankMap[order[pos]] = pos;
    }
    return rankMap;
}

function getSeedGradient(seed) {
    const hash = hashSeed(seed);
    const hue1 = hash % 360;
    const hue2 = (hue1 + 140) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 75%, 45%), hsl(${hue2}, 85%, 35%))`;
}

/**
 * RevealTimer - Alternative Focus Timer view where a hidden image uncovers
 * grid tile by tile as session time progresses.
 */
export default function RevealTimer({ progressFraction, revealSeed, displayMins, displaySecs, celebrationMsg, isRunning }) {
    const activeSeed = revealSeed || 42;
    const imageUrl = `https://picsum.photos/seed/${activeSeed}/600/450`;

    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);

    // Preload image
    useEffect(() => {
        setImgLoaded(false);
        setImgError(false);
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => setImgLoaded(true);
        img.onerror = () => setImgError(true);
    }, [imageUrl]);

    // Deterministic tile reveal rank mapping (60 tiles: 10 columns x 6 rows)
    const totalTiles = 60;
    const tileRanks = useMemo(() => getSeededTileRanks(activeSeed, totalTiles), [activeSeed]);
    const revealedTileCount = Math.round(totalTiles * Math.min(1, Math.max(0, progressFraction)));

    return (
        <div className="relative w-full max-w-xs aspect-[4/3] rounded-2xl overflow-hidden my-2 border-4 border-purple-200 dark:border-purple-900/60 shadow-md bg-gray-200 dark:bg-gray-800">
            {/* Background Image / Seed Gradient Fallback */}
            {imgError ? (
                <div
                    className="absolute inset-0 w-full h-full"
                    style={{ background: getSeedGradient(activeSeed) }}
                />
            ) : (
                <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}>
                    <img
                        src={imageUrl}
                        alt="Focus reveal picture"
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Placeholder shimmer while image is loading */}
            {!imgLoaded && !imgError && (
                <div
                    className="absolute inset-0 w-full h-full animate-pulse"
                    style={{ background: getSeedGradient(activeSeed) }}
                />
            )}

            {/* Grid of 60 Cover Tiles (10 columns x 6 rows) */}
            <div className="absolute inset-0 grid grid-cols-10 grid-rows-6 z-10 pointer-events-none">
                {Array.from({ length: totalTiles }).map((_, tileIndex) => {
                    const rank = tileRanks[tileIndex];
                    const isRevealed = rank < revealedTileCount;
                    return (
                        <div
                            key={tileIndex}
                            className={`bg-gray-100 dark:bg-gray-900 border-[0.5px] border-gray-200/40 dark:border-gray-800/40 transition-opacity duration-600 ease-out ${
                                isRevealed ? 'opacity-0' : 'opacity-100'
                            }`}
                        />
                    );
                })}
            </div>

            {/* Completion Banner */}
            {celebrationMsg && (
                <div className="absolute top-3 inset-x-3 px-3 py-2 rounded-xl bg-emerald-500/90 text-white font-bold text-xs text-center shadow-lg backdrop-blur-xs z-20 animate-bounce">
                    You revealed today's picture! 🖼️
                </div>
            )}

            {/* Time Overlay Chip */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-xs border border-white/20 text-white flex items-center gap-2 shadow-lg z-20">
                <span className="text-xl font-black font-mono tracking-tight">
                    {displayMins}:{displaySecs}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    {celebrationMsg ? '✨ Uncovered!' : (isRunning ? 'Focusing' : 'Paused')}
                </span>
            </div>
        </div>
    );
}
