export const CATEGORIES = [
    { id: 'core', labelEn: 'Core Needs', labelMl: 'പ്രധാന ആവശ്യങ്ങൾ' },
    { id: 'feelings', labelEn: 'Feelings', labelMl: 'വികാരങ്ങൾ' },
    { id: 'people_places', labelEn: 'People & Places', labelMl: 'വ്യക്തികളും സ്ഥലങ്ങളും' },
    { id: 'actions', labelEn: 'Actions', labelMl: 'പ്രവർത്തനങ്ങൾ' }
];

export const DEFAULT_TILES = [
    // Core needs
    { id: 'want', labelEn: 'I want', labelMl: 'എനിക്ക് വേണം', iconName: 'Hand', category: 'core' },
    { id: 'need', labelEn: 'I need', labelMl: 'എനിക്ക് ആവശ്യമുണ്ട്', iconName: 'Heart', category: 'core' },
    { id: 'help', labelEn: 'Help', labelMl: 'സഹായം', iconName: 'HelpCircle', category: 'core' },
    { id: 'stop', labelEn: 'Stop', labelMl: 'നിർത്തുക', iconName: 'Octagon', category: 'core' },
    { id: 'more', labelEn: 'More', labelMl: 'കൂടുതൽ', iconName: 'PlusCircle', category: 'core' },
    { id: 'done', labelEn: 'Done', labelMl: 'കഴിഞ്ഞു', iconName: 'CheckCircle', category: 'core' },
    { id: 'yes', labelEn: 'Yes', labelMl: 'അതെ', iconName: 'ThumbsUp', category: 'core' },
    { id: 'no', labelEn: 'No', labelMl: 'അല്ല', iconName: 'ThumbsDown', category: 'core' },

    // Feelings
    { id: 'happy', labelEn: 'Happy', labelMl: 'സന്തോഷം', iconName: 'Smile', category: 'feelings' },
    { id: 'sad', labelEn: 'Sad', labelMl: 'വിഷമം', iconName: 'Frown', category: 'feelings' },
    { id: 'angry', labelEn: 'Angry', labelMl: 'ദേഷ്യം', iconName: 'Flame', category: 'feelings' },
    { id: 'tired', labelEn: 'Tired', labelMl: 'ക്ഷീണം', iconName: 'Battery', category: 'feelings' },
    { id: 'scared', labelEn: 'Scared', labelMl: 'ഭയം', iconName: 'Zap', category: 'feelings' },
    { id: 'overwhelmed', labelEn: 'Overwhelmed', labelMl: 'വിഷമഘട്ടം', iconName: 'ShieldAlert', category: 'feelings' },
    { id: 'okay', labelEn: 'Okay', labelMl: 'കുഴപ്പമില്ല', iconName: 'Check', category: 'feelings' },

    // People/Places
    { id: 'home', labelEn: 'Home', labelMl: 'വീട്', iconName: 'Home', category: 'people_places' },
    { id: 'school', labelEn: 'School', labelMl: 'സ്കൂൾ', iconName: 'School', category: 'people_places' },
    { id: 'bathroom', labelEn: 'Bathroom', labelMl: 'ബാത്ത്റൂം', iconName: 'Droplet', category: 'people_places' },
    { id: 'outside', labelEn: 'Outside', labelMl: 'പുറത്ത്', iconName: 'Sun', category: 'people_places' },
    { id: 'mom', labelEn: 'Mom', labelMl: 'അമ്മ', iconName: 'User', category: 'people_places' },
    { id: 'dad', labelEn: 'Dad', labelMl: 'അച്ഛൻ', iconName: 'User', category: 'people_places' },
    { id: 'teacher', labelEn: 'Teacher', labelMl: 'ടീച്ചർ', iconName: 'GraduationCap', category: 'people_places' },
    { id: 'friend', labelEn: 'Friend', labelMl: 'കൂട്ടുകാരൻ', iconName: 'Users', category: 'people_places' },

    // Common actions
    { id: 'eat', labelEn: 'Eat', labelMl: 'ഭക്ഷണം', iconName: 'Utensils', category: 'actions' },
    { id: 'drink', labelEn: 'Drink', labelMl: 'വെള്ളം കുടിക്കുക', iconName: 'Coffee', category: 'actions' },
    { id: 'play', labelEn: 'Play', labelMl: 'കളിക്കുക', iconName: 'Gamepad2', category: 'actions' },
    { id: 'sleep', labelEn: 'Sleep', labelMl: 'ഉറങ്ങുക', iconName: 'Moon', category: 'actions' },
    { id: 'go', labelEn: 'Go', labelMl: 'പോകുക', iconName: 'ArrowRight', category: 'actions' },
    { id: 'wait', labelEn: 'Wait', labelMl: 'കാത്തിരിക്കുക', iconName: 'Clock', category: 'actions' }
];
