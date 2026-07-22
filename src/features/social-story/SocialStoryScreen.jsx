import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import ScreenHeader from '../../shared/components/ScreenHeader';
import IconButton from '../../shared/components/IconButton';
import useProfileStore from '../../store/useProfileStore';

import CreateTab from './CreateTab';
import LibraryTab from './LibraryTab';
import ReadStoryView from './ReadStoryView';

/**
 * SocialStoryScreen — Main routed screen for the Social Story Generator.
 *
 * Route: /social-story
 * Tabs: create | library  (controlled via state, deep-linkable via ?tab= query param)
 * Reading mode: when a story is selected, the full view switches to ReadStoryView
 */

const TABS = [
  { id: 'create', label: '✨ Create', ariaLabel: 'Create a new story with AI' },
  { id: 'library', label: '📚 Library', ariaLabel: 'Browse prebuilt stories' },
];

export default function SocialStoryScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const primaryMode = useProfileStore((s) => s.primaryMode);

  // Tab state — supports deep-linking via ?tab=library
  const initialTab = searchParams.get('tab') || 'create';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Story reading state — when set, shows ReadStoryView instead of tabs
  const [readingStory, setReadingStory] = useState(null);

  // Sync tab with query param changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && (tab === 'create' || tab === 'library')) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleBack = () => {
    if (readingStory) {
      setReadingStory(null);
    } else {
      navigate('/dashboard');
    }
  };

  const handleSelectStory = (story) => {
    setReadingStory(story);
  };

  const handleStoryGenerated = (story) => {
    setReadingStory(story);
  };

  const getTitle = () => {
    if (readingStory) return readingStory.title;
    return 'Social Stories';
  };

  const rightAction = !readingStory ? (
    <IconButton
      icon={Settings}
      label="Settings"
      onClick={() => navigate('/settings')}
    />
  ) : null;

  const isLowVision = primaryMode === 'lowVision';

  return (
    <div
      className={`flex-1 flex flex-col min-h-screen ${isLowVision
          ? 'bg-gray-950 text-white'
          : 'bg-white dark:bg-gray-900'
        }`}
    >
      {/* Header */}
      <ScreenHeader
        title={getTitle()}
        onBack={handleBack}
        showBack={true}
        rightAction={rightAction}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-y-auto pb-24 max-w-[420px] mx-auto w-full">
        {readingStory ? (
          /* ── Reading Mode ── */
          <ReadStoryView
            story={readingStory}
            onBack={() => setReadingStory(null)}
          />
        ) : (
          /* ── Tab Mode ── */
          <div className="flex-1 flex flex-col">
            {/* Tab bar */}
            <div className="flex border-b border-gray-100 dark:border-gray-700 px-4 pt-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-label={tab.ariaLabel}
                  aria-selected={activeTab === tab.id}
                  role="tab"
                  className={`
                    relative flex-1 py-3 text-center font-semibold transition-colors
                    min-h-touch
                    ${activeTab === tab.id
                      ? 'text-accent-autism'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                    }
                  `}
                  style={{ fontSize: 'var(--a11y-font-size-base, 1rem)' }}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="social-story-tab-indicator"
                      className="absolute bottom-0 left-2 right-2 h-[3px] bg-accent-autism rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 px-4 py-5">
              {activeTab === 'create' && (
                <CreateTab onStoryGenerated={handleStoryGenerated} />
              )}
              {activeTab === 'library' && (
                <LibraryTab onSelectStory={handleSelectStory} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
