/**
 * ROUTINE_TEMPLATES — ready-made routines covering the most common
 * daily-living sequences. Purely static content, no API calls, so
 * "Templates" always works even offline / without any AI key configured.
 */
export const ROUTINE_TEMPLATES = [
    {
        key: 'morning',
        title: 'Morning Routine',
        iconName: 'Sun',
        colorKey: 'adhd',
        steps: [
            { label: 'Wake up and stretch', iconName: 'Sunrise' },
            { label: 'Brush teeth', iconName: 'Brush' },
            { label: 'Wash face', iconName: 'Droplet' },
            { label: 'Get dressed', iconName: 'Shirt' },
            { label: 'Eat breakfast', iconName: 'Utensils' },
            { label: 'Pack backpack', iconName: 'Backpack' },
        ],
    },
    {
        key: 'bedtime',
        title: 'Bedtime Routine',
        iconName: 'Moon',
        colorKey: 'autism',
        steps: [
            { label: 'Tidy up toys', iconName: 'Sparkles' },
            { label: 'Bath or shower', iconName: 'Bath' },
            { label: 'Brush teeth', iconName: 'Brush' },
            { label: 'Put on pajamas', iconName: 'Shirt' },
            { label: 'Read a book', iconName: 'Book' },
            { label: 'Lights out', iconName: 'Bed' },
        ],
    },
    {
        key: 'school',
        title: 'Getting Ready for School',
        iconName: 'School',
        colorKey: 'primary',
        steps: [
            { label: 'Get dressed', iconName: 'Shirt' },
            { label: 'Eat breakfast', iconName: 'Utensils' },
            { label: 'Brush teeth', iconName: 'Brush' },
            { label: 'Check backpack', iconName: 'Backpack' },
            { label: 'Put on shoes', iconName: 'Footprints' },
            { label: 'Wait for bus or car', iconName: 'Bus' },
        ],
    },
    {
        key: 'homework',
        title: 'Homework Time',
        iconName: 'BookOpen',
        colorKey: 'dyscalculia',
        steps: [
            { label: 'Clear your desk', iconName: 'Sparkles' },
            { label: 'Get out materials', iconName: 'Pencil' },
            { label: 'Do assignment one', iconName: 'BookOpen' },
            { label: 'Take a short break', iconName: 'Heart' },
            { label: 'Do assignment two', iconName: 'BookOpen' },
            { label: 'Pack it back up', iconName: 'Backpack' },
        ],
    },
    {
        key: 'chores',
        title: 'After-School Chores',
        iconName: 'Trash2',
        colorKey: 'dyslexia',
        steps: [
            { label: 'Put away shoes', iconName: 'Footprints' },
            { label: 'Wash hands', iconName: 'Droplet' },
            { label: 'Have a snack', iconName: 'Apple' },
            { label: 'Tidy your room', iconName: 'Sparkles' },
            { label: 'Take out trash', iconName: 'Trash2' },
            { label: 'Free time', iconName: 'Gamepad2' },
        ],
    },
];
