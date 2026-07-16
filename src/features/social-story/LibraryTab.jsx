import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen } from 'lucide-react';
import Card from '../../shared/components/Card';
import prebuiltStories, { CATEGORIES } from './lib/prebuiltStories';

/**
 * LibraryTab — Grid of prebuilt social stories, filterable by category.
 *
 * Props:
 *   onSelectStory: (story) => void — opens the story in ReadStoryView
 */
export default function LibraryTab({ onSelectStory }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStories = prebuiltStories.filter((story) => {
    const matchesCategory =
      activeCategory === 'all' || story.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search stories…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-card bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-autism/40 transition-shadow min-h-touch"
          style={{
            fontSize: 'var(--a11y-font-size-base, 1rem)',
            fontFamily: 'var(--a11y-font-body)',
          }}
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`
              shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium
              transition-all duration-200 min-h-[36px]
              ${
                activeCategory === cat.id
                  ? 'bg-accent-autism text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Story cards grid */}
      <div className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {filteredStories.map((story, index) => (
            <motion.div
              key={story.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.04, duration: 0.2 }}
            >
              <Card
                onClick={() => onSelectStory(story)}
                className="active:scale-[0.98]"
              >
                <div className="flex items-start gap-3">
                  {/* Emoji avatar */}
                  <div className="w-12 h-12 rounded-xl bg-accent-autism/10 dark:bg-accent-autism/20 flex items-center justify-center shrink-0 text-2xl">
                    {story.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-gray-800 dark:text-gray-100 truncate"
                      style={{ fontSize: 'var(--a11y-font-size-base, 1rem)' }}
                    >
                      {story.title}
                    </h3>
                    <p
                      className="text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2"
                      style={{ fontSize: 'var(--a11y-font-size-base, 0.875rem)' }}
                    >
                      {story.description}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-accent-autism">
                      <BookOpen size={14} />
                      <span className="text-xs font-medium">
                        {story.pages.length} pages
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredStories.length === 0 && (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">📖</p>
            <p
              className="text-gray-500 dark:text-gray-400"
              style={{ fontSize: 'var(--a11y-font-size-base, 1rem)' }}
            >
              No stories found. Try a different search or category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
