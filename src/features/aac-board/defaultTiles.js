export const CATEGORIES = [
    { id: 'core', labelEn: 'Core Words', labelMl: 'ആവശ്യങ്ങൾ', iconName: 'Heart', color: 'emerald' },
    { id: 'feelings', labelEn: 'Feelings', labelMl: 'വികാരങ്ങൾ', iconName: 'Smile', color: 'amber' },
    { id: 'people_places', labelEn: 'People & Places', labelMl: 'സ്ഥലങ്ങൾ', iconName: 'Users', color: 'purple' },
    { id: 'actions', labelEn: 'Actions', labelMl: 'പ്രവർത്തനങ്ങൾ', iconName: 'Zap', color: 'blue' },
];

export const DEFAULT_TILES = [
    // --- Core Words (Page 1 - 8 tiles matching mockup exactly) ---
    { 
        id: 'want', 
        labelEn: 'I want', 
        labelMl: 'എനിക്ക് വേണം', 
        iconName: 'Hand', 
        category: 'core',
        tileColor: 'green', // light green card
        page: 1
    },
    { 
        id: 'need', 
        labelEn: 'I need', 
        labelMl: 'എനിക്ക് ആവശ്യമുണ്ട്', 
        iconName: 'UserCheck', 
        category: 'core',
        tileColor: 'blue', // light blue card
        page: 1
    },
    { 
        id: 'help', 
        labelEn: 'Help', 
        labelMl: 'സഹായം', 
        iconName: 'HelpCircle', 
        category: 'core',
        tileColor: 'yellow', // light yellow card
        page: 1
    },
    { 
        id: 'stop', 
        labelEn: 'Stop', 
        labelMl: 'നിർത്തുക', 
        iconName: 'Octagon', 
        category: 'core',
        tileColor: 'red', // light red card
        page: 1
    },
    { 
        id: 'more', 
        labelEn: 'More', 
        labelMl: 'കൂടുതൽ', 
        iconName: 'ArrowRight', 
        category: 'core',
        tileColor: 'purple', // light purple card
        page: 1
    },
    { 
        id: 'done', 
        labelEn: 'Done', 
        labelMl: 'കഴിഞ്ഞു', 
        iconName: 'CheckCircle2', 
        category: 'core',
        tileColor: 'green', // light green card
        page: 1
    },
    { 
        id: 'yes', 
        labelEn: 'Yes', 
        labelMl: 'അതെ', 
        iconName: 'ThumbsUp', 
        category: 'core',
        tileColor: 'green', // light green card
        page: 1
    },
    { 
        id: 'no', 
        labelEn: 'No', 
        labelMl: 'അല്ല', 
        iconName: 'ThumbsDown', 
        category: 'core',
        tileColor: 'red', // light red card
        page: 1
    },

    // --- Core Words (Page 2) ---
    { id: 'please', labelEn: 'Please', labelMl: 'ദയവായി', iconName: 'HeartHandshake', category: 'core', tileColor: 'yellow', page: 2 },
    { id: 'thanks', labelEn: 'Thank you', labelMl: 'നന്ദി', iconName: 'Smile', category: 'core', tileColor: 'green', page: 2 },
    { id: 'look', labelEn: 'Look', labelMl: 'നോക്കുക', iconName: 'Eye', category: 'core', tileColor: 'blue', page: 2 },
    { id: 'listen', labelEn: 'Listen', labelMl: 'ശ്രദ്ധിക്കുക', iconName: 'Ear', category: 'core', tileColor: 'purple', page: 2 },
    { id: 'good', labelEn: 'Good', labelMl: 'നല്ലത്', iconName: 'Sparkles', category: 'core', tileColor: 'green', page: 2 },
    { id: 'bad', labelEn: 'Bad', labelMl: 'മോശം', iconName: 'AlertTriangle', category: 'core', tileColor: 'red', page: 2 },
    { id: 'big', labelEn: 'Big', labelMl: 'വലുത്', iconName: 'Maximize2', category: 'core', tileColor: 'blue', page: 2 },
    { id: 'small', labelEn: 'Small', labelMl: 'ചെറുത്', iconName: 'Minimize2', category: 'core', tileColor: 'purple', page: 2 },

    // --- Feelings ---
    { id: 'happy', labelEn: 'Happy', labelMl: 'സന്തോഷം', iconName: 'Smile', category: 'feelings', tileColor: 'yellow', page: 1 },
    { id: 'sad', labelEn: 'Sad', labelMl: 'വിഷമം', iconName: 'Frown', category: 'feelings', tileColor: 'blue', page: 1 },
    { id: 'angry', labelEn: 'Angry', labelMl: 'ദേഷ്യം', iconName: 'Flame', category: 'feelings', tileColor: 'red', page: 1 },
    { id: 'tired', labelEn: 'Tired', labelMl: 'ക്ഷീണം', iconName: 'Battery', category: 'feelings', tileColor: 'purple', page: 1 },
    { id: 'scared', labelEn: 'Scared', labelMl: 'ഭയം', iconName: 'Zap', category: 'feelings', tileColor: 'yellow', page: 1 },
    { id: 'overwhelmed', labelEn: 'Overwhelmed', labelMl: 'വിഷമഘട്ടം', iconName: 'ShieldAlert', category: 'feelings', tileColor: 'red', page: 1 },
    { id: 'okay', labelEn: 'Okay', labelMl: 'കുഴപ്പമില്ല', iconName: 'CheckCircle2', category: 'feelings', tileColor: 'green', page: 1 },
    { id: 'excited', labelEn: 'Excited', labelMl: 'ആവേശം', iconName: 'Sparkles', category: 'feelings', tileColor: 'yellow', page: 1 },

    // --- People & Places ---
    { id: 'home', labelEn: 'Home', labelMl: 'വീട്', iconName: 'Home', category: 'people_places', tileColor: 'green', page: 1 },
    { id: 'school', labelEn: 'School', labelMl: 'സ്കൂൾ', iconName: 'School', category: 'people_places', tileColor: 'blue', page: 1 },
    { id: 'bathroom', labelEn: 'Bathroom', labelMl: 'ബാത്ത്റൂം', iconName: 'Droplet', category: 'people_places', tileColor: 'purple', page: 1 },
    { id: 'outside', labelEn: 'Outside', labelMl: 'പുറത്ത്', iconName: 'Sun', category: 'people_places', tileColor: 'yellow', page: 1 },
    { id: 'mom', labelEn: 'Mom', labelMl: 'അമ്മ', iconName: 'User', category: 'people_places', tileColor: 'green', page: 1 },
    { id: 'dad', labelEn: 'Dad', labelMl: 'അച്ഛൻ', iconName: 'UserCheck', category: 'people_places', tileColor: 'blue', page: 1 },
    { id: 'teacher', labelEn: 'Teacher', labelMl: 'ടീച്ചർ', iconName: 'GraduationCap', category: 'people_places', tileColor: 'purple', page: 1 },
    { id: 'friend', labelEn: 'Friend', labelMl: 'കൂട്ടുകാരൻ', iconName: 'Users', category: 'people_places', tileColor: 'yellow', page: 1 },

    // --- Actions ---
    { id: 'eat', labelEn: 'Eat', labelMl: 'ഭക്ഷണം', iconName: 'Utensils', category: 'actions', tileColor: 'green', page: 1 },
    { id: 'drink', labelEn: 'Drink', labelMl: 'വെള്ളം കുടിക്കുക', iconName: 'Coffee', category: 'actions', tileColor: 'blue', page: 1 },
    { id: 'play', labelEn: 'Play', labelMl: 'കളിക്കുക', iconName: 'Gamepad2', category: 'actions', tileColor: 'yellow', page: 1 },
    { id: 'sleep', labelEn: 'Sleep', labelMl: 'ഉറങ്ങുക', iconName: 'Moon', category: 'actions', tileColor: 'purple', page: 1 },
    { id: 'go', labelEn: 'Go', labelMl: 'പോകുക', iconName: 'ArrowRight', category: 'actions', tileColor: 'green', page: 1 },
    { id: 'wait', labelEn: 'Wait', labelMl: 'കാത്തിരിക്കുക', iconName: 'Clock', category: 'actions', tileColor: 'yellow', page: 1 },
    { id: 'run', labelEn: 'Run', labelMl: 'ഓടുക', iconName: 'Activity', category: 'actions', tileColor: 'blue', page: 1 },
    { id: 'stop_act', labelEn: 'Stop', labelMl: 'നിർത്തുക', iconName: 'Octagon', category: 'actions', tileColor: 'red', page: 1 },
];
