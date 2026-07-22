import {
    Sun, Sunrise, Bed, Moon, Sunset, ShowerHead, Bath, Droplet, Brush, Shirt,
    Utensils, Soup, Apple, Milk, Backpack, BookOpen, Book, Pencil, School, Bus,
    Car, Home, Gamepad2, Tv, Music, PawPrint, Footprints, HandHeart, Heart,
    Smile, Sparkles, Trash2, AlarmClock, Clock, Bell, Star,
} from 'lucide-react';

/**
 * ROUTINE_ICONS — a curated set of Lucide icons used as "pictures" for
 * routine steps. This intentionally avoids needing any image-generation
 * API/key: Lucide is already a project dependency, so every step gets a
 * clear, consistent, accessible picture for free.
 *
 * If a more photo-realistic picture is ever wanted for a step, this is the
 * one place to swap in an async image (e.g. shared/lib/aiClient.js's
 * generateLearnImage, which needs VITE_CF_ACCOUNT_ID) without touching the
 * rest of the feature.
 */
export const ROUTINE_ICONS = [
    { name: 'Sun', label: 'Morning', Icon: Sun },
    { name: 'Sunrise', label: 'Wake up', Icon: Sunrise },
    { name: 'Bed', label: 'Bed', Icon: Bed },
    { name: 'Moon', label: 'Night', Icon: Moon },
    { name: 'Sunset', label: 'Evening', Icon: Sunset },
    { name: 'ShowerHead', label: 'Shower', Icon: ShowerHead },
    { name: 'Bath', label: 'Bath', Icon: Bath },
    { name: 'Droplet', label: 'Wash up', Icon: Droplet },
    { name: 'Brush', label: 'Brush teeth', Icon: Brush },
    { name: 'Shirt', label: 'Get dressed', Icon: Shirt },
    { name: 'Utensils', label: 'Eat', Icon: Utensils },
    { name: 'Soup', label: 'Meal', Icon: Soup },
    { name: 'Apple', label: 'Snack', Icon: Apple },
    { name: 'Milk', label: 'Drink', Icon: Milk },
    { name: 'Backpack', label: 'Backpack', Icon: Backpack },
    { name: 'BookOpen', label: 'Homework', Icon: BookOpen },
    { name: 'Book', label: 'Reading', Icon: Book },
    { name: 'Pencil', label: 'Writing', Icon: Pencil },
    { name: 'School', label: 'School', Icon: School },
    { name: 'Bus', label: 'Bus', Icon: Bus },
    { name: 'Car', label: 'Car ride', Icon: Car },
    { name: 'Home', label: 'Home', Icon: Home },
    { name: 'Gamepad2', label: 'Play', Icon: Gamepad2 },
    { name: 'Tv', label: 'Screen time', Icon: Tv },
    { name: 'Music', label: 'Music', Icon: Music },
    { name: 'PawPrint', label: 'Pet', Icon: PawPrint },
    { name: 'Footprints', label: 'Walk', Icon: Footprints },
    { name: 'HandHeart', label: 'Kindness', Icon: HandHeart },
    { name: 'Heart', label: 'Calm down', Icon: Heart },
    { name: 'Smile', label: 'Feelings check', Icon: Smile },
    { name: 'Sparkles', label: 'Tidy up', Icon: Sparkles },
    { name: 'Trash2', label: 'Chores', Icon: Trash2 },
    { name: 'AlarmClock', label: 'Alarm', Icon: AlarmClock },
    { name: 'Clock', label: 'Time', Icon: Clock },
    { name: 'Bell', label: 'Reminder', Icon: Bell },
    { name: 'Star', label: 'Reward', Icon: Star },
];

export const ROUTINE_ICON_NAMES = ROUTINE_ICONS.map((i) => i.name);

export function getRoutineIcon(name) {
    return ROUTINE_ICONS.find((i) => i.name === name)?.Icon || Star;
}

/** Color tags for routine cards — reuse existing design tokens, no new colors invented. */
export const ROUTINE_COLORS = [
    { key: 'primary', label: 'Purple', bg: 'bg-primary', text: 'text-primary', border: 'border-primary/30' },
    { key: 'adhd', label: 'Red', bg: 'bg-accent-adhd', text: 'text-accent-adhd', border: 'border-accent-adhd/30' },
    { key: 'autism', label: 'Blue', bg: 'bg-accent-autism', text: 'text-accent-autism', border: 'border-accent-autism/30' },
    { key: 'dyslexia', label: 'Amber', bg: 'bg-accent-dyslexia', text: 'text-accent-dyslexia', border: 'border-accent-dyslexia/30' },
    { key: 'dyscalculia', label: 'Green', bg: 'bg-accent-dyscalculia', text: 'text-accent-dyscalculia', border: 'border-accent-dyscalculia/30' },
];

export function getRoutineColor(key) {
    return ROUTINE_COLORS.find((c) => c.key === key) || ROUTINE_COLORS[0];
}
