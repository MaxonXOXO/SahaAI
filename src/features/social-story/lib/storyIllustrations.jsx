import {
  Sunrise,
  BedDouble,
  Backpack,
  FileText,
  Handshake,
  Users,
  Angry,
  Frown,
  Stethoscope,
  BellRing,
  MapPin,
  RefreshCw,
  Ear,
  HandHelping,
  Share2,
  UtensilsCrossed,
  PartyPopper,
  BookOpen,
} from 'lucide-react';

/**
 * storyIllustrations.jsx — Free, local, no-API illustration system for the
 * Social Story feature.
 *
 * Instead of calling an image-generation API (extra cost + network dependency +
 * slower loads), every story gets one static "illustration": a themed Lucide
 * icon inside a soft rounded card, built from the app's existing accent-autism
 * design tokens. Zero cost, zero network calls, works offline.
 *
 * Usage:
 *   - Prebuilt stories: set an explicit `illustration` key on the story object
 *     in prebuiltStories.js (see ILLUSTRATIONS keys below).
 *   - AI-generated stories: CreateTab.jsx picks a key automatically via
 *     TEMPLATE_ILLUSTRATION_MAP (for template scenarios) or
 *     matchIllustrationFromText (for freeform "Write My Own" prompts).
 */

export const ILLUSTRATIONS = {
  morning: { icon: Sunrise, label: 'Morning routine' },
  bedtime: { icon: BedDouble, label: 'Bedtime routine' },
  school: { icon: Backpack, label: 'Going to school' },
  test: { icon: FileText, label: 'Taking a test' },
  friends: { icon: Handshake, label: 'Making a friend' },
  waitingLine: { icon: Users, label: 'Waiting in line' },
  calmAnger: { icon: Angry, label: 'Feeling angry' },
  calmWorry: { icon: Frown, label: 'Feeling worried' },
  doctor: { icon: Stethoscope, label: 'Doctor visit' },
  fireDrill: { icon: BellRing, label: 'Fire drill' },
  newPlace: { icon: MapPin, label: 'Somewhere new' },
  routineChange: { icon: RefreshCw, label: 'Change in routine' },
  sensory: { icon: Ear, label: 'Sensory overload' },
  askHelp: { icon: HandHelping, label: 'Asking for help' },
  sharing: { icon: Share2, label: 'Sharing & turns' },
  restaurant: { icon: UtensilsCrossed, label: 'Eating out' },
  party: { icon: PartyPopper, label: 'Going to a party' },
  default: { icon: BookOpen, label: 'Social story' },
};

/** Maps CreateTab's SCENARIO_TEMPLATES ids straight to an illustration key. */
export const TEMPLATE_ILLUSTRATION_MAP = {
  'new-place': 'newPlace',
  'change-routine': 'routineChange',
  'sensory-overload': 'sensory',
  'asking-for-help': 'askHelp',
  'sharing-toys': 'sharing',
  'eating-out': 'restaurant',
  'birthday-party': 'party',
};

/** Keyword bank so a freeform "Write My Own" prompt still gets a fitting picture. */
const KEYWORDS = {
  morning: ['morning', 'wake up', 'alarm', 'breakfast'],
  bedtime: ['bed', 'sleep', 'night', 'pyjama', 'pajama'],
  school: ['school', 'classroom', 'backpack', 'homework'],
  test: ['test', 'exam', 'quiz'],
  friends: ['friend', 'making friends', 'meet someone', 'meeting someone'],
  waitingLine: ['line', 'queue', 'waiting my turn'],
  calmAnger: ['angry', 'anger', 'mad', 'frustrat'],
  calmWorry: ['worried', 'worry', 'anxious', 'anxiety', 'nervous', 'scared'],
  doctor: ['doctor', 'dentist', 'hospital', 'clinic', 'nurse', 'shot', 'vaccine'],
  fireDrill: ['fire drill', 'evacuat'],
  newPlace: ['new place', 'unfamiliar', 'first time visiting', 'somewhere new'],
  routineChange: ['routine', 'schedule change', 'plans change', 'unexpected change'],
  sensory: ['loud', 'noise', 'noisy', 'crowd', 'sensory', 'overload', 'overwhelm'],
  askHelp: ['ask for help', 'asking for help', 'need help'],
  sharing: ['share', 'sharing', 'taking turns', 'turn'],
  restaurant: ['restaurant', 'eating out', 'dinner', 'order food', 'waiter'],
  party: ['party', 'birthday', 'celebration'],
};

/**
 * Pick the best-fitting illustration key for a freeform scenario/description
 * string. Falls back to 'default' (an open book) if nothing scores.
 */
export function matchIllustrationFromText(text = '') {
  const lower = text.toLowerCase();
  let bestKey = 'default';
  let bestScore = 0;

  for (const [key, words] of Object.entries(KEYWORDS)) {
    const score = words.reduce((acc, w) => (lower.includes(w) ? acc + 1 : acc), 0);
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  return bestKey;
}

/**
 * StoryIllustration — renders a soft, rounded, icon-based illustration.
 * No external image, no API call — just a Lucide icon + the app's own
 * accent-autism color tokens, so it fully matches the rest of the UI.
 *
 * Props:
 *   illustrationKey: string — one of the ILLUSTRATIONS keys above
 *   size: 'sm' | 'md' | 'lg'  (sm = library card thumbnail, lg = reading-view hero)
 */
export default function StoryIllustration({ illustrationKey, size = 'md', className = '' }) {
  const config = ILLUSTRATIONS[illustrationKey] || ILLUSTRATIONS.default;
  const Icon = config.icon;

  const sizeMap = {
    sm: { box: 'w-12 h-12', blob: 32, icon: 18 },
    md: { box: 'w-14 h-14', blob: 40, icon: 22 },
    lg: { box: 'w-full h-36', blob: 88, icon: 46 },
  };
  const s = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-card bg-accent-autism/10 dark:bg-accent-autism/15 shrink-0 ${s.box} ${className}`}
      role="img"
      aria-label={config.label}
    >
      {/* Soft decorative background shapes — gives it an "illustration" feel */}
      <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-accent-autism/15 dark:bg-accent-autism/20" />
      <div className="absolute -bottom-4 -left-4 w-12 h-12 rounded-full bg-accent-autism/10" />

      {/* Icon "badge" */}
      <div
        className="relative flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-900/50 shadow-sm"
        style={{ width: s.blob, height: s.blob }}
      >
        <Icon size={s.icon} className="text-accent-autism" strokeWidth={1.75} />
      </div>
    </div>
  );
}
