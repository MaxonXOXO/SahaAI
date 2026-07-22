import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Lightbulb,
  CheckCircle2,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import Button from '../../shared/components/Button';
import IconButton from '../../shared/components/IconButton';
import { generateSpeech } from '../../shared/lib/aiClient';
import { logActivity } from '../../shared/lib/logActivity';
import useProfileStore from '../../store/useProfileStore';
import StoryIllustration from './lib/storyIllustrations';
import { generateStoryImage } from './lib/storyPrompts';

/**
 * ReadStoryView — Interactive, step-by-step social story reader.
 *
 * Props:
 *   story: { title, emoji, illustration, coverImagePrompt, pages: [{ text, tip, imagePrompt }] }
 *   onBack: () => void — return to previous view
 *
 * Each page's imagePrompt is sent to generateStoryImage() (OpenAI gpt-image-1)
 * on demand and cached per story.id — the free icon illustration is shown
 * while that request is in flight, on error, or if imagePrompt is missing.
 */
export default function ReadStoryView({ story, onBack }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const audioRef = useRef(null);
  const userId = useProfileStore((s) => s.id);

  const page = story.pages[currentPage];
  const totalPages = story.pages.length;
  const isLastPage = currentPage === totalPages - 1;
  const isFirstPage = currentPage === 0;

  // ── Per-page AI illustrations (OpenAI gpt-image-1) ─────
  // pageImages[index] = { status: 'loading' | 'ready' | 'error', url }
  // Falls back to the free icon illustration (StoryIllustration) while
  // loading, on error, or if a page has no imagePrompt at all.
  const [pageImages, setPageImages] = useState({});

  useEffect(() => {
    let cancelled = false;

    const loadImage = (pageIndex) => {
      const targetPage = story.pages[pageIndex];
      if (!targetPage?.imagePrompt) return;

      setPageImages((prev) => {
        if (prev[pageIndex]) return prev; // already loading/loaded — don't restart
        return { ...prev, [pageIndex]: { status: 'loading', url: null } };
      });

      const cacheKey = `${story.id}-page-${pageIndex}`;
      generateStoryImage(targetPage.imagePrompt, cacheKey)
        .then((url) => {
          if (!cancelled) {
            setPageImages((prev) => ({ ...prev, [pageIndex]: { status: 'ready', url } }));
          }
        })
        .catch((err) => {
          console.error('Story image generation failed:', err);
          if (!cancelled) {
            setPageImages((prev) => ({ ...prev, [pageIndex]: { status: 'error', url: null } }));
          }
        });
    };

    // Load the current page now, and quietly prefetch the next one
    // so advancing feels instant instead of waiting on a fresh generation.
    loadImage(currentPage);
    if (currentPage + 1 < totalPages) {
      loadImage(currentPage + 1);
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, story.id]);

  // Best-effort: cache a cover image for this story so LibraryTab can show
  // a real thumbnail next time, without LibraryTab itself triggering a call.
  useEffect(() => {
    if (!story.coverImagePrompt) return;
    generateStoryImage(story.coverImagePrompt, story.id).catch(() => {
      // Silent — the cover thumbnail is a nice-to-have, not required for reading.
    });
  }, [story.id, story.coverImagePrompt]);

  const currentImage = pageImages[currentPage];

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleNext = useCallback(() => {
    if (isLastPage) {
      setCompleted(true);
      // Log activity when story is completed
      logActivity(userId, 'social_story_completed', {
        storyTitle: story.title,
        pagesRead: totalPages,
      });
      return;
    }
    setDirection(1);
    setShowTip(false);
    stopAudio();
    setCurrentPage((p) => p + 1);
  }, [isLastPage, userId, story.title, totalPages]);

  const handlePrev = useCallback(() => {
    if (isFirstPage) return;
    setDirection(-1);
    setShowTip(false);
    stopAudio();
    setCurrentPage((p) => p - 1);
  }, [isFirstPage]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleReadAloud = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    try {
      setIsPlaying(true);
      const textToRead = page.text + (showTip && page.tip ? '. Tip: ' + page.tip : '');
      const audioBlob = await generateSpeech(textToRead);
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };

      await audio.play();
    } catch (err) {
      console.error('TTS failed:', err);
      setIsPlaying(false);
    }
  };

  const handleRestart = () => {
    setCompleted(false);
    setCurrentPage(0);
    setShowTip(false);
    setDirection(1);
    stopAudio();
  };

  // Slide animation variants
  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 200 : -200,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir) => ({
      x: dir > 0 ? -200 : 200,
      opacity: 0,
    }),
  };

  // ── Completion Screen ──────────────────────────────────
  if (completed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
        >
          <CheckCircle2 size={40} className="text-green-500" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h2
            className="font-bold text-gray-800 dark:text-gray-100 mb-2"
            style={{ fontSize: 'var(--a11y-font-size-md, 1.125rem)' }}
          >
            Great Job! 🎉
          </h2>
          <p
            className="text-gray-500 dark:text-gray-400"
            style={{ fontSize: 'var(--a11y-font-size-base, 1rem)' }}
          >
            You finished reading "{story.title}". You are doing amazing!
          </p>
        </motion.div>

        <div className="flex flex-col gap-3 w-full max-w-[280px]">
          <Button variant="primary" size="lg" icon={RotateCcw} onClick={handleRestart}>
            Read Again
          </Button>
          <Button variant="secondary" size="lg" onClick={onBack}>
            Back to Stories
          </Button>
        </div>
      </div>
    );
  }

  // ── Reading View ───────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col px-4 py-4 gap-4">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <span
          className="text-gray-400 dark:text-gray-500 font-medium shrink-0"
          style={{ fontSize: 'var(--a11y-font-size-base, 0.875rem)' }}
        >
          {currentPage + 1} / {totalPages}
        </span>
        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent-autism rounded-full"
            initial={false}
            animate={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Story title */}
      <div className="text-center">
        <span className="text-2xl">{story.emoji}</span>
        <h2
          className="font-bold text-gray-800 dark:text-gray-100 mt-1"
          style={{ fontSize: 'var(--a11y-font-size-md, 1.125rem)' }}
        >
          {story.title}
        </h2>
      </div>

      {/* Page content with animation */}
      <div className="flex-1 flex flex-col justify-center relative min-h-[220px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentPage}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex flex-col gap-4"
          >
            {/* Page illustration — real AI image once generated, icon while loading/on error */}
            <div className="relative w-full h-40 rounded-card overflow-hidden">
              {currentImage?.status === 'ready' ? (
                <motion.img
                  key={currentImage.url}
                  src={currentImage.url}
                  alt=""
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <StoryIllustration
                    illustrationKey={story.illustration}
                    size="lg"
                    className="!h-40"
                  />
                  {currentImage?.status === 'loading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/30">
                      <Loader2 size={22} className="animate-spin text-accent-autism" />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Main text card */}
            <div
              className="rounded-card p-5 border border-accent-autism/20"
              style={{
                background: 'var(--a11y-surface, #fff)',
                boxShadow: 'var(--a11y-shadow, 0 2px 12px rgba(59,130,246,0.08))',
              }}
            >
              <p
                className="text-gray-800 dark:text-gray-100 leading-relaxed"
                style={{
                  fontSize: 'var(--a11y-font-size-md, 1.125rem)',
                  fontFamily: 'var(--a11y-font-body)',
                  letterSpacing: 'var(--a11y-letter-spacing, 0.01em)',
                  lineHeight: '1.8',
                }}
              >
                {page.text}
              </p>
            </div>

            {/* Tip section */}
            <AnimatePresence>
              {showTip && page.tip && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-card p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30"
                >
                  <div className="flex items-start gap-2">
                    <Lightbulb size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <p
                      className="text-amber-800 dark:text-amber-200"
                      style={{
                        fontSize: 'var(--a11y-font-size-base, 0.875rem)',
                        fontFamily: 'var(--a11y-font-body)',
                        lineHeight: '1.6',
                      }}
                    >
                      {page.tip}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action buttons row */}
      <div className="flex items-center justify-center gap-3 mb-2">
        <IconButton
          icon={isPlaying ? VolumeX : Volume2}
          label={isPlaying ? 'Stop reading' : 'Read aloud'}
          variant="default"
          onClick={handleReadAloud}
        />
        <button
          onClick={() => setShowTip(!showTip)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 min-h-touch transition-colors hover:bg-amber-200 dark:hover:bg-amber-900/50"
          style={{ fontSize: 'var(--a11y-font-size-base, 0.875rem)' }}
        >
          <Lightbulb size={16} />
          {showTip ? 'Hide Tip' : 'Show Tip'}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 pb-2">
        <Button
          variant="ghost"
          onClick={handlePrev}
          disabled={isFirstPage}
          icon={ChevronLeft}
          className="text-gray-600 dark:text-gray-300"
        >
          Back
        </Button>

        <Button
          variant="primary"
          onClick={handleNext}
          className="flex-1 max-w-[200px]"
        >
          {isLastPage ? '✅ Finish' : 'Next'}
          {!isLastPage && <ChevronRight size={18} className="ml-1" />}
        </Button>
      </div>
    </div>
  );
}
