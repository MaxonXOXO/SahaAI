import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    User, Accessibility, Eye, Volume2, Globe, Bell, 
    Shield, HelpCircle, Info, ChevronRight, LogOut, X, Check,
    BookOpen, Zap, Users, Calculator
} from 'lucide-react';
import useProfileStore from '../../store/useProfileStore';
import useSettingsStore from '../../store/useSettingsStore';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Button from '../../shared/components/Button';
import { translate } from '../../shared/lib/translations';

// ─── Needs meta ──────────────────────────────────────────────────────────────
const NEEDS_META = [
    { key: 'dyslexia', labelKey: 'dyslexia', Icon: BookOpen, color: 'bg-accent-dyslexia' },
    { key: 'adhd', labelKey: 'adhd', Icon: Zap, color: 'bg-accent-adhd' },
    { key: 'autism', labelKey: 'autism', Icon: Users, color: 'bg-accent-autism' },
    { key: 'dyscalculia', labelKey: 'dyscalculia', Icon: Calculator, color: 'bg-accent-dyscalculia' },
    { key: 'lowVision', labelKey: 'lowVision', Icon: Eye, color: 'bg-accent-lowvision' },
];

function getNeedLabel(key, lang = 'en') {
    const labels = {
        dyslexia: { en: 'Dyslexia', ml: 'ഡിസ്‌ലെക്സിയ (Dyslexia)' },
        adhd: { en: 'ADHD', ml: 'എഡിഎച്ച്ഡി (ADHD)' },
        autism: { en: 'Autism', ml: 'ഓട്ടിസം (Autism)' },
        dyscalculia: { en: 'Dyscalculia', ml: 'ഡിസ്‌കാൽക്കുലിയ (Dyscalculia)' },
        lowVision: { en: 'Low Vision', ml: 'കുറഞ്ഞ കാഴ്ച (Low Vision)' },
    };
    return labels[key]?.[lang] || labels[key]?.en || key;
}

export default function ProfileScreen() {
    const navigate = useNavigate();
    const profile = useProfileStore();
    const logout = useProfileStore((s) => s.logout);
    const settings = useSettingsStore();
    const displayLanguage = settings.displayLanguage;

    // Get active needs list for primary mode selection
    const activeNeeds = Object.entries(profile.needs || {})
        .filter(([, active]) => active)
        .map(([key]) => key);

    // Modal states for settings details
    const [activeModal, setActiveModal] = useState(null); // 'accessibility' | 'display' | 'speech' | 'language' | null

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-y-auto pb-24">
            <ScreenHeader title={translate('profileTitle', displayLanguage)} showBack={false} />

            {/* User Info Header Card */}
            <div className="m-4 p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {profile.avatar_base64 ? (
                        <img
                            src={profile.avatar_base64}
                            alt="Avatar"
                            className="w-16 h-16 rounded-full object-cover border-2 border-primary/30"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-xl uppercase">
                            {(profile.name || profile.username || 'US').slice(0, 2)}
                        </div>
                    )}
                    <div>
                        <h2 className="text-base-md font-bold text-gray-800 dark:text-gray-100">
                            {profile.name || profile.username || 'Saha User'}
                        </h2>
                        <p className="text-xs text-gray-400 font-medium capitalize">
                            {profile.role === 'Student' || !profile.role
                                ? translate('student', displayLanguage)
                                : profile.role}
                        </p>
                        {profile.pronouns ? (
                            <p className="text-xs text-primary font-medium mt-0.5">{profile.pronouns}</p>
                        ) : null}
                    </div>
                </div>
                <button
                    onClick={() => navigate('/edit-profile')}
                    className="px-4 py-2 text-xs font-semibold text-primary border-2 border-primary/20 hover:border-primary/50 rounded-full transition-colors bg-primary/5"
                >
                    {translate('editProfile', displayLanguage)}
                </button>
            </div>

            {/* Settings Menu List */}
            <div className="mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
                {/* Accessibility Preferences */}
                <button 
                    onClick={() => setActiveModal('accessibility')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-accent-autism/10 flex items-center justify-center text-accent-autism">
                            <Accessibility size={18} />
                        </div>
                        <div>
                            <p className="text-base-sm font-medium text-gray-800 dark:text-gray-100">
                                {translate('menuAccessibility', displayLanguage)}
                            </p>
                            <p className="text-xs text-gray-400">
                                {translate('menuAccessibilityDesc', displayLanguage)}
                            </p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                </button>

                {/* Display & Font Settings */}
                <button 
                    onClick={() => setActiveModal('display')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-accent-lowvision/10 flex items-center justify-center text-accent-lowvision">
                            <Eye size={18} />
                        </div>
                        <div>
                            <p className="text-base-sm font-medium text-gray-800 dark:text-gray-100">
                                {translate('menuDisplay', displayLanguage)}
                            </p>
                            <p className="text-xs text-gray-400">
                                {translate('menuDisplayDesc', displayLanguage)}
                            </p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                </button>

                {/* Speech & Voice Settings */}
                <button 
                    onClick={() => setActiveModal('speech')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-accent-adhd/10 flex items-center justify-center text-accent-adhd">
                            <Volume2 size={18} />
                        </div>
                        <div>
                            <p className="text-base-sm font-medium text-gray-800 dark:text-gray-100">
                                {translate('menuSpeech', displayLanguage)}
                            </p>
                            <p className="text-xs text-gray-400">
                                {translate('menuSpeechDesc', displayLanguage)}
                            </p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                </button>

                {/* Language Selection */}
                <button 
                    onClick={() => setActiveModal('language')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Globe size={18} />
                        </div>
                        <div>
                            <p className="text-base-sm font-medium text-gray-800 dark:text-gray-100">
                                {translate('menuLanguage', displayLanguage)}
                            </p>
                            <p className="text-xs text-gray-400">
                                {translate('menuLanguageDesc', displayLanguage)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-primary bg-primary/5 px-2.5 py-1 rounded-full">
                            {settings.displayLanguage === 'ml' ? 'മലയാളം' : 'English'}
                        </span>
                        <ChevronRight size={18} className="text-gray-400" />
                    </div>
                </button>

                {/* Notification Settings */}
                <div className="w-full flex items-center justify-between p-4 opacity-60">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-750 flex items-center justify-center text-gray-500">
                            <Bell size={18} />
                        </div>
                        <div>
                            <p className="text-base-sm font-medium text-gray-800 dark:text-gray-100">
                                {displayLanguage === 'ml' ? 'അറിയിപ്പ് ക്രമീകരണങ്ങൾ' : 'Notification Settings'}
                            </p>
                            <p className="text-xs text-gray-400">
                                {displayLanguage === 'ml' ? 'അലേർട്ടുകളും ഓർമ്മപ്പെടുത്തലുകളും ക്രമീകരിക്കുക' : 'Manage alerts & reminders'}
                            </p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                </div>

                {/* Privacy & Data */}
                <div className="w-full flex items-center justify-between p-4 opacity-60">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-750 flex items-center justify-center text-gray-500">
                            <Shield size={18} />
                        </div>
                        <div>
                            <p className="text-base-sm font-medium text-gray-800 dark:text-gray-100">
                                {displayLanguage === 'ml' ? 'സ്വകാര്യതയും ഡാറ്റയും' : 'Privacy & Data'}
                            </p>
                            <p className="text-xs text-gray-400">
                                {displayLanguage === 'ml' ? 'ഡാറ്റാ അനുമതികൾ നിയന്ത്രിക്കുക' : 'Control data permissions'}
                            </p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                </div>

                {/* Help & Support */}
                <div className="w-full flex items-center justify-between p-4 opacity-60">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-750 flex items-center justify-center text-gray-500">
                            <HelpCircle size={18} />
                        </div>
                        <div>
                            <p className="text-base-sm font-medium text-gray-800 dark:text-gray-100">
                                {displayLanguage === 'ml' ? 'സഹായവും പിന്തുണയും' : 'Help & Support'}
                            </p>
                            <p className="text-xs text-gray-400">
                                {displayLanguage === 'ml' ? 'മാർഗ്ഗനിർദ്ദേശങ്ങൾ, നുറുങ്ങുകൾ & സഹായം' : 'Guides, tips & direct help'}
                            </p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                </div>

                {/* About SahaAI */}
                <div className="w-full flex items-center justify-between p-4 opacity-60">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-750 flex items-center justify-center text-gray-500">
                            <Info size={18} />
                        </div>
                        <div>
                            <p className="text-base-sm font-medium text-gray-800 dark:text-gray-100">
                                {displayLanguage === 'ml' ? 'സഹ ആപ്പിനെക്കുറിച്ച്' : 'About SahaAI'}
                            </p>
                            <p className="text-xs text-gray-400">
                                {displayLanguage === 'ml' ? 'ആപ്പിന്റെ വിവരങ്ങളും ക്രെഡിറ്റുകളും' : 'App information & credits'}
                            </p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                </div>
            </div>

            {/* Logout Button */}
            <div className="m-4 mt-6">
                <Button 
                    onClick={handleLogout} 
                    variant="secondary" 
                    className="w-full border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-center gap-2"
                >
                    <LogOut size={16} />
                    {translate('logout', displayLanguage)}
                </Button>
            </div>

            {/* MODAL / DIALOGS */}
            {activeModal && (
                <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setActiveModal(null)}>
                    <div 
                        className="bg-white dark:bg-gray-800 w-full max-w-[380px] rounded-3xl p-5 shadow-xl max-h-[85vh] overflow-y-auto animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
                            <h3 className="text-base-md font-bold text-gray-800 dark:text-gray-100 capitalize">
                                {activeModal === 'accessibility' && translate('accPreferencesTitle', displayLanguage)}
                                {activeModal === 'display' && translate('menuDisplay', displayLanguage)}
                                {activeModal === 'speech' && translate('menuSpeech', displayLanguage)}
                                {activeModal === 'language' && translate('menuLanguage', displayLanguage)}
                            </h3>
                            <button 
                                onClick={() => setActiveModal(null)}
                                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Accessibility Preferences Content */}
                        {activeModal === 'accessibility' && (
                            <div className="flex flex-col gap-5">
                                <div className="flex flex-col gap-3">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                                        {displayLanguage === 'ml' ? 'അക്സസിബിലിറ്റി ആവശ്യങ്ങൾ' : 'Accessibility Needs'}
                                    </p>
                                    {NEEDS_META.map(({ key, Icon }) => (
                                        <div 
                                            key={key} 
                                            onClick={() => profile.toggleNeed(key)}
                                            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                                                profile.needs[key] 
                                                    ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon size={18} className={profile.needs[key] ? 'text-primary' : 'text-gray-400'} />
                                                <p className="text-base-sm font-semibold text-gray-800 dark:text-gray-100">
                                                    {getNeedLabel(key, displayLanguage)}
                                                </p>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                profile.needs[key] ? 'bg-primary border-primary text-white' : 'border-gray-300'
                                            }`}>
                                                {profile.needs[key] && <Check size={14} strokeWidth={3} />}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {activeNeeds.length > 1 && (
                                    <div className="flex flex-col gap-3">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                                            {translate('primaryModeSelect', displayLanguage)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 px-1 mb-1">
                                            {translate('primaryModeSelectDesc', displayLanguage)}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {activeNeeds.map((needKey) => {
                                                const meta = NEEDS_META.find(n => n.key === needKey);
                                                if (!meta) return null;
                                                const Icon = meta.Icon;
                                                const isSelected = profile.primaryMode === needKey;
                                                return (
                                                    <button
                                                        key={needKey}
                                                        type="button"
                                                        onClick={() => profile.updateProfile({ primaryMode: needKey })}
                                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-colors ${
                                                            isSelected
                                                                ? 'bg-primary border-primary text-white'
                                                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary/40'
                                                        }`}
                                                    >
                                                        <Icon size={16} />
                                                        <span className="text-base-sm font-semibold">
                                                            {getNeedLabel(needKey, displayLanguage)}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Display & Font Settings Content */}
                        {activeModal === 'display' && (
                            <div className="flex flex-col gap-6 py-2">
                                {/* Font Family */}
                                <div className="flex flex-col gap-2">
                                    <p className="text-base-sm font-bold text-gray-800 dark:text-gray-100">
                                        {translate('fontStyle', displayLanguage)}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(settings.displayLanguage === 'ml'
                                            ? [
                                                { id: 'default', label: translate('fontStyleMalayalamStandard', displayLanguage) },
                                                { id: 'dyslexia', label: translate('fontStyleMalayalamDyslexic', displayLanguage) },
                                            ]
                                            : [
                                                { id: 'default', label: translate('fontStyleStandard', displayLanguage) },
                                                { id: 'dyslexia', label: translate('fontStyleDyslexic', displayLanguage) },
                                            ]
                                        ).map(font => {
                                            const isDisabled = profile.needs.dyslexia;
                                            return (
                                                <button
                                                    key={font.id}
                                                    disabled={isDisabled}
                                                    onClick={() => settings.updateSettings({ fontFamily: font.id })}
                                                    className={`px-4 py-2 rounded-xl border-2 text-sm transition-colors text-center font-medium ${
                                                        (isDisabled ? (font.id === 'dyslexia') : settings.fontFamily === font.id)
                                                            ? 'border-primary bg-primary/10 text-primary'
                                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary/40'
                                                    } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {font.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Font Size / UI Scale */}
                                <div className="flex flex-col gap-2">
                                    <p className="text-base-sm font-bold text-gray-800 dark:text-gray-100">
                                        {translate('uiDisplayScale', displayLanguage)}
                                    </p>
                                    <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-750 rounded-xl">
                                        {['small', 'medium', 'large'].map(size => (
                                            <button
                                                key={size}
                                                onClick={() => settings.updateSettings({ fontSize: size })}
                                                className={`flex-1 py-2 rounded-lg text-sm transition-colors capitalize ${
                                                    settings.fontSize === size
                                                        ? 'bg-white dark:bg-gray-600 shadow-sm font-bold text-gray-900 dark:text-white'
                                                        : 'text-gray-500 dark:text-gray-400'
                                                }`}
                                            >
                                                {size === 'small' ? translate('scaleSmall', displayLanguage) : size === 'medium' ? translate('scaleMedium', displayLanguage) : translate('scaleLarge', displayLanguage)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Font Weight */}
                                <div className="flex flex-col gap-2">
                                    <p className="text-base-sm font-bold text-gray-800 dark:text-gray-100">
                                        {translate('textThickness', displayLanguage)}
                                    </p>
                                    <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-750 rounded-xl">
                                        {['normal', 'medium', 'bold'].map(weight => (
                                            <button
                                                key={weight}
                                                onClick={() => settings.updateSettings({ fontWeight: weight })}
                                                className={`flex-1 py-2 rounded-lg text-sm transition-colors capitalize ${
                                                    settings.fontWeight === weight
                                                        ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white'
                                                        : 'text-gray-500 dark:text-gray-400'
                                                }`}
                                                style={{ fontWeight: weight === 'normal' ? 400 : weight === 'medium' ? 500 : 700 }}
                                            >
                                                {weight === 'normal' ? translate('normal', displayLanguage) : weight === 'medium' ? translate('medium', displayLanguage) : translate('bold', displayLanguage)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Contrast Settings */}
                                <div className="flex flex-col gap-2">
                                    <p className="text-base-sm font-bold text-gray-800 dark:text-gray-100">
                                        {translate('themeContrastMode', displayLanguage)}
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        {[
                                            { id: 'light', label: translate('themeLight', displayLanguage), desc: translate('themeLightDesc', displayLanguage) },
                                            { id: 'dark', label: translate('themeDark', displayLanguage), desc: translate('themeDarkDesc', displayLanguage) },
                                            { id: 'soft', label: translate('themeSoft', displayLanguage), desc: translate('themeSoftDesc', displayLanguage) },
                                            { id: 'high', label: translate('themeHigh', displayLanguage), desc: translate('themeHighDesc', displayLanguage) },
                                        ].map(contrast => (
                                            <button
                                                key={contrast.id}
                                                onClick={() => settings.updateSettings({ contrastMode: contrast.id })}
                                                className={`flex items-center justify-between p-3 rounded-xl border-2 transition-colors w-full flex ${
                                                    settings.contrastMode === contrast.id 
                                                        ? 'border-yellow-400 bg-yellow-400/10' 
                                                        : 'border-gray-200 dark:border-gray-700'
                                                }`}
                                            >
                                                <div className="text-left">
                                                    <p className={`text-base-sm font-bold ${settings.contrastMode === contrast.id ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                                        {contrast.label}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{contrast.desc}</p>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                    settings.contrastMode === contrast.id ? 'border-yellow-400 bg-yellow-400 text-black' : 'border-gray-300'
                                                }`}>
                                                    {settings.contrastMode === contrast.id && <Check size={12} strokeWidth={4} />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Speech & Voice Settings Content */}
                        {activeModal === 'speech' && (
                            <div className="flex flex-col gap-4 py-2">
                                <div>
                                    <p className="text-base-sm font-bold text-gray-800 dark:text-gray-100 mb-1">
                                        {displayLanguage === 'ml' ? 'ടെക്സ്റ്റ്-ടു-സ്പീച്ച് (TTS)' : 'Text-to-Speech (TTS)'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {displayLanguage === 'ml' ? 'സിംപ്ലിഫയർ അല്ലെങ്കിൽ ചാറ്റിൽ നിന്നുള്ള ടെക്സ്റ്റ് ഉറക്കെ വായിക്കുന്നതിനുള്ള ക്രമീകരണങ്ങൾ മാറ്റുക.' : 'Configure parameters for reading aloud text from Simplifiers or chat.'}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between p-3 border border-gray-150 dark:border-gray-700 rounded-xl">
                                        <div>
                                            <p className="text-base-sm font-semibold text-gray-800 dark:text-gray-100">
                                                {displayLanguage === 'ml' ? 'എഐ മറുപടികൾ സ്വയം വായിക്കുക' : 'Auto-read AI Responses'}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {displayLanguage === 'ml' ? 'വരുന്ന സന്ദേശങ്ങൾ സ്വയമേവ ഉറക്കെ വായിക്കുക' : 'Automatically read incoming chat aloud'}
                                            </p>
                                        </div>
                                        <div className="w-12 h-6 bg-gray-250 dark:bg-gray-750 rounded-full p-1 cursor-pointer">
                                            <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 border border-gray-150 dark:border-gray-700 rounded-xl">
                                        <div>
                                            <p className="text-base-sm font-semibold text-gray-800 dark:text-gray-100">
                                                {displayLanguage === 'ml' ? 'വായനാ വേഗത' : 'Read Speed'}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {displayLanguage === 'ml' ? 'സാധാരണ (1.0x)' : 'Normal (1.0x)'}
                                            </p>
                                        </div>
                                        <ChevronRight size={18} className="text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Language Selection Content */}
                        {activeModal === 'language' && (
                            <div className="flex flex-col gap-5 py-2">
                                {/* Language selector helper */}
                                {(() => {
                                    const LangSelect = ({ label, settingKey }) => (
                                        <div className="flex flex-col gap-2">
                                            <p className="text-base-sm font-bold text-gray-800 dark:text-gray-100">{label}</p>
                                            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-750 rounded-xl">
                                                {[
                                                    { code: 'en', label: 'English' },
                                                    { code: 'ml', label: 'മലയാളം' }
                                                ].map(lang => (
                                                    <button
                                                        key={lang.code}
                                                        onClick={() => settings.updateSettings({ [settingKey]: lang.code })}
                                                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                                                            settings[settingKey] === lang.code
                                                                ? 'bg-white dark:bg-gray-600 shadow-sm text-primary dark:text-white'
                                                                : 'text-gray-500 dark:text-gray-400'
                                                        }`}
                                                    >
                                                        {lang.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );

                                    return (
                                        <>
                                            <LangSelect label={translate('langDisplay', displayLanguage)} settingKey="displayLanguage" />
                                            <LangSelect label={translate('langTts', displayLanguage)} settingKey="ttsLanguage" />
                                            <LangSelect label={translate('langAi', displayLanguage)} settingKey="aiLanguage" />
                                            <LangSelect label={translate('langSpeech', displayLanguage)} settingKey="speechLanguage" />
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
