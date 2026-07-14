import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    User, Accessibility, Eye, Volume2, Globe, Bell, 
    Shield, HelpCircle, Info, ChevronRight, LogOut, X, Check
} from 'lucide-react';
import useProfileStore from '../../store/useProfileStore';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Button from '../../shared/components/Button';

export default function ProfileScreen() {
    const navigate = useNavigate();
    const profile = useProfileStore();
    const logout = useProfileStore((s) => s.logout);

    // Modal states for settings details
    const [activeModal, setActiveModal] = useState(null); // 'accessibility' | 'display' | 'speech' | 'language' | null

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    // Capitalize first letter helper
    const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

    return (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-y-auto pb-6">
            <ScreenHeader title="Profile & Settings" showBack={false} />

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
                            {profile.role || 'Student'}
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
                    Edit Profile
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
                            <p className="text-base-sm font-medium text-gray-800 dark:text-gray-100">Accessibility Preferences</p>
                            <p className="text-xs text-gray-400">Configure learning aids & support</p>
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
                            <p className="text-base-sm font-medium text-gray-800 dark:text-gray-100">Display & Font Settings</p>
                            <p className="text-xs text-gray-400">Dyslexia fonts, high-contrast, sizing</p>
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
                            <p className="text-base-sm font-medium text-gray-800 dark:text-gray-100">Speech & Voice Settings</p>
                            <p className="text-xs text-gray-400">Screen reader speed & voice options</p>
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
                            <p className="text-base-sm font-medium text-gray-800 dark:text-gray-100">Language</p>
                            <p className="text-xs text-gray-400">Choose translation settings</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-primary bg-primary/5 px-2.5 py-1 rounded-full">
                            {profile.language === 'ml' ? 'മലയാളം' : 'English'}
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
                            <p className="text-base-sm font-medium text-gray-800 dark:text-gray-100">Notification Settings</p>
                            <p className="text-xs text-gray-400">Manage alerts & reminders</p>
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
                            <p className="text-base-sm font-medium text-gray-800 dark:text-gray-100">Privacy & Data</p>
                            <p className="text-xs text-gray-400">Control data permissions</p>
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
                            <p className="text-base-sm font-medium text-gray-800 dark:text-gray-100">Help & Support</p>
                            <p className="text-xs text-gray-400">Guides, tips & direct help</p>
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
                            <p className="text-base-sm font-medium text-gray-800 dark:text-gray-100">About SahaAI</p>
                            <p className="text-xs text-gray-400">App information & credits</p>
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
                    Log Out
                </Button>
            </div>

            {/* MODAL BOTTOM SHEETS */}
            {activeModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center animate-fade-in" onClick={() => setActiveModal(null)}>
                    <div 
                        className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-3xl p-5 shadow-xl max-h-[85vh] overflow-y-auto animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
                            <h3 className="text-base-md font-bold text-gray-800 dark:text-gray-100 capitalize">
                                {activeModal === 'accessibility' && 'Accessibility Preferences'}
                                {activeModal === 'display' && 'Display & Font Settings'}
                                {activeModal === 'speech' && 'Speech & Voice Settings'}
                                {activeModal === 'language' && 'Language Selection'}
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
                            <div className="flex flex-col gap-3">
                                {[
                                    { key: 'dyslexia', title: 'Dyslexia Mode', desc: 'Saves fonts & spacing adaptations.' },
                                    { key: 'adhd', title: 'ADHD Helper', desc: 'Minimizes distractions & adds tools.' },
                                    { key: 'autism', title: 'Autism Helper', desc: 'Predictable interfaces & social helpers.' },
                                    { key: 'dyscalculia', title: 'Dyscalculia Helper', desc: 'Visual math block representation.' },
                                    { key: 'lowVision', title: 'Low Vision Mode', desc: 'Bigger text, speech, & high contrast.' }
                                ].map((need) => (
                                    <div 
                                        key={need.key} 
                                        onClick={() => profile.toggleNeed(need.key)}
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                                            profile.needs[need.key] 
                                                ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <div>
                                            <p className="text-base-sm font-semibold text-gray-800 dark:text-gray-100">{need.title}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{need.desc}</p>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                            profile.needs[need.key] ? 'bg-primary border-primary text-white' : 'border-gray-300'
                                        }`}>
                                            {profile.needs[need.key] && <Check size={14} strokeWidth={3} />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Display & Font Settings Content */}
                        {activeModal === 'display' && (
                            <div className="flex flex-col gap-4 py-2">
                                <div>
                                    <p className="text-base-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Accessibility Layout Helpers</p>
                                    <p className="text-xs text-gray-400">
                                        These options dynamically adjust fonts, sizes, and spacing across the entire application interface to make content easier to consume.
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Preview Text</span>
                                    <p className="text-base-sm font-medium mt-1 text-gray-800 dark:text-gray-100">
                                        SahaAI adapts its layout to accommodate your visual and reading preferences.
                                    </p>
                                </div>
                                <p className="text-xs text-gray-400 italic text-center mt-2">
                                    Adaptive font features are activated automatically based on your accessibility profile.
                                </p>
                            </div>
                        )}

                        {/* Speech & Voice Settings Content */}
                        {activeModal === 'speech' && (
                            <div className="flex flex-col gap-4 py-2">
                                <div>
                                    <p className="text-base-sm font-bold text-gray-800 dark:text-gray-100 mb-1">Text-to-Speech (TTS)</p>
                                    <p className="text-xs text-gray-400">Configure parameters for reading aloud text from Simplifiers or chat.</p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between p-3 border border-gray-150 dark:border-gray-700 rounded-xl">
                                        <div>
                                            <p className="text-base-sm font-semibold text-gray-800 dark:text-gray-100">Auto-read AI Responses</p>
                                            <p className="text-xs text-gray-400">Automatically read incoming chat aloud</p>
                                        </div>
                                        <div className="w-12 h-6 bg-gray-250 dark:bg-gray-700 rounded-full p-1 cursor-pointer">
                                            <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 border border-gray-150 dark:border-gray-700 rounded-xl">
                                        <div>
                                            <p className="text-base-sm font-semibold text-gray-800 dark:text-gray-100">Read Speed</p>
                                            <p className="text-xs text-gray-400">Normal (1.0x)</p>
                                        </div>
                                        <ChevronRight size={18} className="text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Language Selection Content */}
                        {activeModal === 'language' && (
                            <div className="flex flex-col gap-3">
                                {[
                                    { code: 'en', label: 'English', desc: 'Standard english language interface' },
                                    { code: 'ml', label: 'മലയാളം (Malayalam)', desc: 'മലയാള ഭാഷയിലുള്ള സഹായം' }
                                ].map((lang) => (
                                    <div 
                                        key={lang.code}
                                        onClick={async () => {
                                            await profile.updateProfile({ language: lang.code });
                                        }}
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                                            profile.language === lang.code 
                                                ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <div>
                                            <p className="text-base-sm font-semibold text-gray-800 dark:text-gray-100">{lang.label}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{lang.desc}</p>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                            profile.language === lang.code ? 'bg-primary border-primary text-white' : 'border-gray-300'
                                        }`}>
                                            {profile.language === lang.code && <Check size={14} strokeWidth={3} />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
