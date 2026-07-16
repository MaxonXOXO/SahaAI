import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import useProfileStore from '../../store/useProfileStore';
import { SCENARIO_TEMPLATES, generateSocialStory } from './lib/storyPrompts';

/**
 * CreateTab — AI-powered social story generator.
 *
 * Users pick a scenario template or write their own,
 * then AI generates a story they can read interactively.
 *
 * Props:
 *   onStoryGenerated: (story) => void — switches to ReadStoryView
 */
export default function CreateTab({ onStoryGenerated }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const name = useProfileStore((s) => s.name);
  const username = useProfileStore((s) => s.username);
  const language = useProfileStore((s) => s.language);
  const needs = useProfileStore((s) => s.needs);
  const profile = { name, username, language, needs };

  const handleGenerate = async () => {
    let scenario = '';
    if (selectedTemplate === 'custom') {
      scenario = customPrompt.trim();
      if (!scenario) {
        setError('Please describe the situation you want a story about.');
        return;
      }
    } else {
      const template = SCENARIO_TEMPLATES.find((t) => t.id === selectedTemplate);
      scenario = template?.prompt || '';
    }

    if (!scenario) {
      setError('Please select a scenario first.');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const story = await generateSocialStory(scenario, profile);
      // Ensure the generated story has required shape
      if (story && story.pages && story.pages.length > 0) {
        onStoryGenerated({
          ...story,
          id: 'ai-' + Date.now(),
          category: 'custom',
          description: scenario,
        });
      } else {
        setError('The AI returned an unexpected format. Please try again.');
      }
    } catch (err) {
      console.error('Story generation failed:', err);
      setError('Could not generate story. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Intro */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-autism/10 dark:bg-accent-autism/20 mb-3"
        >
          <Sparkles size={30} className="text-accent-autism" />
        </motion.div>
        <h2
          className="font-bold text-gray-800 dark:text-gray-100"
          style={{ fontSize: 'var(--a11y-font-size-md, 1.125rem)' }}
        >
          Create a Story with AI
        </h2>
        <p
          className="text-gray-500 dark:text-gray-400 mt-1"
          style={{ fontSize: 'var(--a11y-font-size-base, 0.875rem)' }}
        >
          Pick a situation or describe your own, and AI will write a social story for you.
        </p>
      </div>

      {/* Scenario templates */}
      <div className="flex flex-col gap-2">
        <p
          className="font-semibold text-gray-700 dark:text-gray-200"
          style={{ fontSize: 'var(--a11y-font-size-base, 1rem)' }}
        >
          Choose a Scenario
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SCENARIO_TEMPLATES.map((template) => {
            const isSelected = selectedTemplate === template.id;
            return (
              <motion.button
                key={template.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setSelectedTemplate(template.id);
                  setError(null);
                }}
                className={`
                  flex flex-col items-center gap-1.5 p-3.5 rounded-card text-center
                  transition-all duration-200 min-h-touch border-2
                  ${
                    isSelected
                      ? 'border-accent-autism bg-accent-autism/5 dark:bg-accent-autism/10 shadow-sm'
                      : 'border-transparent bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750'
                  }
                `}
              >
                <span className="text-2xl">{template.emoji}</span>
                <span
                  className={`font-medium leading-tight ${
                    isSelected
                      ? 'text-accent-autism'
                      : 'text-gray-700 dark:text-gray-200'
                  }`}
                  style={{ fontSize: 'var(--a11y-font-size-base, 0.875rem)' }}
                >
                  {template.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Custom prompt input — shown when "Write My Own" is selected */}
      <AnimatePresence>
        {selectedTemplate === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label
              className="block font-medium text-gray-700 dark:text-gray-200 mb-2"
              style={{ fontSize: 'var(--a11y-font-size-base, 0.875rem)' }}
            >
              Describe the situation:
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => {
                setCustomPrompt(e.target.value);
                setError(null);
              }}
              placeholder="Example: I am going to a new dentist for the first time…"
              rows={3}
              className="w-full px-4 py-3 rounded-card bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-autism/40 resize-none min-h-touch"
              style={{
                fontSize: 'var(--a11y-font-size-base, 1rem)',
                fontFamily: 'var(--a11y-font-body)',
                lineHeight: '1.6',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-2 px-4 py-3 rounded-card bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30"
          >
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p
              className="text-red-700 dark:text-red-300"
              style={{ fontSize: 'var(--a11y-font-size-base, 0.875rem)' }}
            >
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate button */}
      <Button
        variant="primary"
        size="lg"
        onClick={handleGenerate}
        disabled={!selectedTemplate || isGenerating}
        icon={isGenerating ? Loader2 : Sparkles}
        className={isGenerating ? '[&_svg]:animate-spin' : ''}
      >
        {isGenerating ? 'Creating Your Story…' : 'Generate Story'}
      </Button>

      {/* Preview hint */}
      {selectedTemplate && selectedTemplate !== 'custom' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p
            className="text-gray-400 dark:text-gray-500 italic"
            style={{ fontSize: 'var(--a11y-font-size-base, 0.75rem)' }}
          >
            AI will create a personalized story about "
            {SCENARIO_TEMPLATES.find((t) => t.id === selectedTemplate)?.description}"
          </p>
        </motion.div>
      )}
    </div>
  );
}
