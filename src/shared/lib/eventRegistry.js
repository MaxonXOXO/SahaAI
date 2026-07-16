/**
 * eventRegistry — single source of truth mapping activity_log event_type
 * values to their feature route, deep-link tab param, and display label.
 * Add an entry here whenever a new event_type is introduced.
 */
export const EVENT_REGISTRY = {
  // Focus Mode
  focus_session_completed: { path: '/focus-mode', tab: null, label: 'Focus Session' },
  task_completed:          { path: '/focus-mode', tab: null, label: 'Task Completed' },
  distraction_blocked:     { path: '/focus-mode', tab: null, label: 'Distraction Blocked' },

  // Routine Builder
  routine_step_completed:  { path: '/routine-builder', tab: null, label: 'Routine Step' },
  routine_followed:        { path: '/routine-builder', tab: null, label: 'Routine Followed' },

  // Text Simplifier / Dyslexia Reader
  text_simplified:         { path: '/text-simplifier', tab: null, label: 'Text Simplifier' },
  read_aloud_used:         { path: '/dyslexia-reader', tab: null, label: 'Read Aloud' },
  spell_check_used:        { path: '/text-simplifier', tab: null, label: 'Spell Check' },
  reading_minutes_logged:  { path: '/dyslexia-reader', tab: null, label: 'Reading Session' },

  // Autism
  social_story_completed:      { path: '/social-story', tab: null, label: 'Social Story' },
  conversation_practice_session: { path: '/conversation-practice', tab: null, label: 'Conversation Practice' },
  emotion_checkin_logged:      { path: '/dashboard', tab: null, label: 'Emotion Check-in' },

  // Dyscalculia
  math_problem_solved:     { path: '/math-helper', tab: 'solve', label: 'Math Solver' },
  step_by_step_used:       { path: '/math-helper', tab: 'steps', label: 'Step-by-Step' },
  time_practiced_logged:   { path: '/math-helper', tab: 'games', label: 'Math Practice' },

  // Low Vision
  document_read:           { path: '/document-reader', tab: null, label: 'Document Read' },
  ocr_scan_used:            { path: '/vision-assistant', tab: 'read', label: 'Text Scan' },
  high_contrast_toggled:   { path: '/settings', tab: null, label: 'High Contrast' },
  magnifier_used:           { path: '/vision-assistant', tab: null, label: 'Magnifier' },

  // AAC Board
  aac_phrase_spoken:       { path: '/aac-board', tab: null, label: 'AAC Board' },
};

/** Turns an event_type into its route + query string, e.g. '/math-helper?tab=games' */
export function getEventLink(eventType) {
  const entry = EVENT_REGISTRY[eventType];
  if (!entry) return null;
  return entry.tab ? `${entry.path}?tab=${entry.tab}` : entry.path;
}

/** Returns display label for an event_type, falls back to the raw string */
export function getEventLabel(eventType) {
  return EVENT_REGISTRY[eventType]?.label ?? eventType;
}
