import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Bookmark, Search, Sparkles, Clock, Tag, AlertCircle, CheckCircle2, CalendarDays, ChevronRight, Heart, Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';
import ScreenHeader from '../../shared/components/ScreenHeader';
import useProfileStore from '../../store/useProfileStore';
import useSettingsStore from '../../store/useSettingsStore';
import useSpeechRecognition from '../../shared/hooks/useSpeechRecognition';
import { saveDiaryEntry, getDiaryEntries, saveMemoryNote, getAllMemoryNotes, queryMemory } from '../../shared/lib/memoryService';

const MOOD_OPTIONS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '🌿', label: 'Calm' },
  { emoji: '🎯', label: 'Focused' },
  { emoji: '⚡', label: 'Energetic' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '💭', label: 'Thoughtful' },
];

export default function DiaryMemoryScreen() {
  const navigate = useNavigate();
  const profile = useProfileStore();
  const userId = profile.id;
  const primaryMode = profile.primaryMode;
  const displayLanguage = useSettingsStore((s) => s.displayLanguage);
  const speechLanguage = useSettingsStore((s) => s.speechLanguage);

  const [activeTab, setActiveTab] = useState('diary'); // 'diary' | 'memory'

  // Diary State
  const [diaryText, setDiaryText] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [loadingDiary, setLoadingDiary] = useState(false);
  const [savingDiary, setSavingDiary] = useState(false);
  const [diaryError, setDiaryError] = useState(null);

  // Memory State
  const [memoryText, setMemoryText] = useState('');
  const [memoryNotes, setMemoryNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loadingMemory, setLoadingMemory] = useState(false);
  const [savingMemory, setSavingMemory] = useState(false);
  const [searchingMemory, setSearchingMemory] = useState(false);
  const [memoryError, setMemoryError] = useState(null);

  const appendDiaryVoiceText = useCallback((transcript) => {
    setDiaryText((current) => current ? `${current} ${transcript}` : transcript);
  }, []);
  const appendMemoryVoiceText = useCallback((transcript) => {
    setMemoryText((current) => current ? `${current} ${transcript}` : transcript);
  }, []);
  const handleDiaryVoiceError = useCallback(() => setDiaryError('Voice input could not be captured. Please try again.'), []);
  const handleMemoryVoiceError = useCallback(() => setMemoryError('Voice input could not be captured. Please try again.'), []);
  const voiceLanguage = speechLanguage === 'ml' ? 'ml-IN' : 'en-US';
  const diaryVoice = useSpeechRecognition({ language: voiceLanguage, onResult: appendDiaryVoiceText, onError: handleDiaryVoiceError });
  const memoryVoice = useSpeechRecognition({ language: voiceLanguage, onResult: appendMemoryVoiceText, onError: handleMemoryVoiceError });

  // Load Diary & Memory Data
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      setLoadingDiary(true);
      setLoadingMemory(true);

      const { data: dData, error: dErr } = await getDiaryEntries(userId);
      if (dErr) setDiaryError(dErr.message);
      else setDiaryEntries(dData || []);
      setLoadingDiary(false);

      const { data: mData, error: mErr } = await getAllMemoryNotes(userId);
      if (mErr) setMemoryError(mErr.message);
      else setMemoryNotes(mData || []);
      setLoadingMemory(false);
    };

    loadData();
  }, [userId]);

  // Handle Save Diary Entry
  const handleSaveDiary = async (e) => {
    e.preventDefault();
    if (!diaryText.trim() || savingDiary || !userId) return;

    setSavingDiary(true);
    setDiaryError(null);

    const moodTag = selectedMood ? `${selectedMood.emoji} ${selectedMood.label}` : null;
    const { data, error } = await saveDiaryEntry(diaryText, moodTag, userId);

    if (error) {
      setDiaryError(error.message);
    } else {
      setDiaryText('');
      setSelectedMood(null);
      // Reload entries
      const { data: updated } = await getDiaryEntries(userId);
      setDiaryEntries(updated || []);
    }
    setSavingDiary(false);
  };

  // Handle Save Memory Note
  const handleSaveMemory = async (e) => {
    e.preventDefault();
    if (!memoryText.trim() || savingMemory || !userId) return;

    setSavingMemory(true);
    setMemoryError(null);

    const { data, error } = await saveMemoryNote(memoryText, userId);

    if (error) {
      setMemoryError(error.message);
    } else {
      setMemoryText('');
      // Reload memory notes
      const { data: updated } = await getAllMemoryNotes(userId);
      setMemoryNotes(updated || []);
    }
    setSavingMemory(false);
  };

  // Handle Memory Similarity Search
  const handleSearchMemory = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim() || !userId) return;

    setSearchingMemory(true);
    setMemoryError(null);

    const { data, error } = await queryMemory(searchQuery, userId, 0.65, 5);

    if (error) {
      setMemoryError(error.message);
    } else {
      setSearchResults(data || []);
    }
    setSearchingMemory(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const isLowVision = primaryMode === 'lowVision';

  return (
    <div
      className={`diary-canvas flex-1 flex flex-col min-h-screen ${
        isLowVision ? 'bg-gray-950 text-white' : 'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100'
      }`}
      style={{
        background: 'var(--a11y-bg, undefined)',
        color: 'var(--a11y-text, undefined)',
      }}
    >
      {/* Screen Header */}
      <ScreenHeader
        title={displayLanguage === 'ml' ? 'പ്രിയ ഡയറിയും ഓർമ്മകളും' : 'Dear Diary & Memory'}
        onBack={() => navigate('/tools')}
        showBack={true}
      />

      {/* Navigation Tabs */}
      <div className="px-4 pt-3 pb-0 max-w-2xl mx-auto w-full">
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('diary')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-t-2xl border font-bold text-sm transition-all duration-200 ${
              activeTab === 'diary'
                ? 'bg-[#f4edff] text-[#6D3AD0] border-[#d8c7fa] shadow-sm'
                : 'bg-white/80 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-white/60 dark:border-gray-700 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4.5 h-4.5" />
            <span>{displayLanguage === 'ml' ? 'ഡയറി' : 'Dear Diary'}</span>
          </button>

          <button
            onClick={() => setActiveTab('memory')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-t-2xl border font-bold text-sm transition-all duration-200 ${
              activeTab === 'memory'
                ? 'bg-[#f4edff] text-[#6D3AD0] border-[#d8c7fa] shadow-sm'
                : 'bg-white/80 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-white/60 dark:border-gray-700 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Bookmark className="w-4.5 h-4.5" />
            <span>{displayLanguage === 'ml' ? 'ഓർമ്മ കുറിപ്പുകൾ' : 'Memory Notes'}</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 flex flex-col px-4 pt-2 pb-24 max-w-2xl mx-auto w-full space-y-6 overflow-y-auto">
        {/* ── T A B  1 :  D I A R Y ── */}
        {activeTab === 'diary' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* New Entry Box */}
            <div className="diary-paper relative overflow-visible bg-[#fffdf7] text-slate-800 rounded-[2rem] p-6 sm:p-8 border border-[#e8ddc9] shadow-[0_8px_0_#b79a75,0_16px_25px_rgba(73,48,20,0.2)] space-y-6">
              <div className="absolute -left-3 top-10 bottom-10 hidden sm:flex flex-col justify-around" aria-hidden="true">
                {Array.from({ length: 7 }).map((_, index) => <span key={index} className="block w-7 h-3 rounded-full bg-slate-400 border-2 border-slate-600 shadow-sm" />)}
              </div>
              <div className="flex items-center justify-end gap-2 text-sm font-semibold text-slate-500 -mb-2">
                <CalendarDays className="w-5 h-5 text-[#7040ce]" />
                {new Date().toLocaleDateString(displayLanguage === 'ml' ? 'ml-IN' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <h2 className="font-extrabold text-base sm:text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                <Sparkles className="w-5 h-5 text-[#7C3AED]" />
                <span>{displayLanguage === 'ml' ? 'ഇന്നത്തെ വിശേഷങ്ങൾ' : 'New Journal Entry'}</span>
              </h2>

              {/* Mood Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {displayLanguage === 'ml' ? 'മനസ്ഥിതി തിരഞ്ഞെടുക്കുക' : 'How are you feeling?'}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 pt-1">
                  {MOOD_OPTIONS.map((mood) => {
                    const isSelected = selectedMood?.label === mood.label;
                    return (
                      <button
                        key={mood.label}
                        type="button"
                        onClick={() => setSelectedMood(isSelected ? null : mood)}
                        className={`min-h-24 flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-2xl text-sm font-bold border transition-all ${
                          isSelected
                            ? 'bg-[#7441d7] text-white border-[#6331c6] shadow-md scale-[1.03]'
                            : 'bg-[#fff7df] text-slate-700 border-[#f1dfb6] hover:border-[#7C3AED]'
                        }`}
                      >
                        <span className="text-3xl leading-none">{mood.emoji}</span>
                        <span>{mood.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Textarea */}
              <div className="relative">
              <textarea
                value={diaryText}
                onChange={(e) => setDiaryText(e.target.value)}
                placeholder={
                  displayLanguage === 'ml'
                    ? 'ഇന്നത്തെ നിങ്ങളുടെ ചിന്തകൾ എഴുതൂ...'
                    : 'Write your thoughts, feelings, or experiences today...'
                }
                rows={7}
                className="diary-lines w-full p-5 pl-10 rounded-2xl border border-[#e5d9bd] text-base sm:text-lg leading-8 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] resize-none text-slate-700 placeholder-slate-500"
              />
              </div>
              {diaryVoice.isListening && <p className="-mt-3 text-xs font-semibold text-[#7040ce] animate-pulse">Listening… speak when ready.</p>}

              {diaryError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{diaryError}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-stretch gap-3">
              <button
                onClick={handleSaveDiary}
                disabled={savingDiary || !diaryText.trim()}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#6d37d1] to-[#8b57e8] hover:from-[#5c2bb8] hover:to-[#7c46d8] active:scale-[0.99] text-white font-extrabold text-base sm:text-lg shadow-[0_4px_0_#4b2499] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingDiary ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5" />
                    <span>{displayLanguage === 'ml' ? 'സേവ് ചെയ്യുക' : 'Save Journal Entry'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={diaryVoice.isListening ? diaryVoice.stop : diaryVoice.start}
                disabled={!diaryVoice.supported}
                aria-label={diaryVoice.isListening ? 'Stop diary voice input' : 'Start diary voice input'}
                title={diaryVoice.supported ? 'Voice input' : 'Voice input is not supported by this browser'}
                className={`w-12 shrink-0 rounded-2xl shadow-[0_4px_0_#4b2499] transition-colors flex items-center justify-center ${diaryVoice.isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-[#7040ce] text-white hover:bg-[#5c2bb8]'} disabled:opacity-40`}
              >
                {diaryVoice.isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              </div>
            </div>

            {/* Past Diary Entries */}
            <div className="diary-past-paper space-y-3 rounded-2xl p-5 border border-[#dfcff6] shadow-sm">
              <h3 className="font-extrabold text-xl text-[#6840c8] flex items-center justify-between gap-2">
                {displayLanguage === 'ml' ? 'മുൻകാല കുറിപ്പുകൾ' : 'Past Journal Entries'}
                <ChevronRight className="w-6 h-6" />
              </h3>

              {loadingDiary ? (
                <div className="text-center py-8 text-gray-400 text-sm">Loading your diary...</div>
              ) : diaryEntries.length === 0 ? (
                <div className="text-center py-5 px-4 text-slate-500 text-sm">
                  <Heart className="w-7 h-7 mx-auto mb-2 text-[#8b57e8]" />
                  No diary entries yet. Write your first entry above!
                </div>
              ) : (
                <div className="space-y-3">
                  {diaryEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(entry.created_at).toLocaleString()}</span>
                        </div>
                        {entry.mood_tag && (
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-[#7C3AED] font-semibold border border-purple-100 dark:border-purple-900/40">
                            {entry.mood_tag}
                          </span>
                        )}
                      </div>
                      <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                        {entry.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── T A B  2 :  M E M O R Y  N O T E S ── */}
        {activeTab === 'memory' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* New Memory Box */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
              <h2 className="font-extrabold text-base sm:text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                <Bookmark className="w-5 h-5 text-[#7C3AED]" />
                <span>{displayLanguage === 'ml' ? 'ഓർമ്മിക്കേണ്ട കാര്യങ്ങൾ' : 'Save a Memory Note'}</span>
              </h2>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                {displayLanguage === 'ml'
                  ? 'പ്രധാനപ്പെട്ട ഓർമ്മകൾ കുറിച്ചു വെക്കുക. പിന്നീട് തിരയാനോ AI ചാറ്റിൽ ലഭിക്കാനോ സഹായിക്കും.'
                  : 'Save short factual notes (e.g. "kept keys in blue bag"). These can be searched with natural language and will be used by SahaAI chat.'}
              </p>

              <input
                type="text"
                value={memoryText}
                onChange={(e) => setMemoryText(e.target.value)}
                placeholder={
                  displayLanguage === 'ml'
                    ? 'എന്താണ് ഓർമ്മിക്കാൻ ആഗ്രഹിക്കുന്നത്?'
                    : 'What do you want to remember?'
                }
                className="w-full p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] text-gray-900 dark:text-white placeholder-gray-400"
              />
              <div className="flex items-center justify-between gap-3 -mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Speak your note in {speechLanguage === 'ml' ? 'Malayalam' : 'English'}.</span>
                <button
                  type="button"
                  onClick={memoryVoice.isListening ? memoryVoice.stop : memoryVoice.start}
                  disabled={!memoryVoice.supported}
                  aria-label={memoryVoice.isListening ? 'Stop memory voice input' : 'Start memory voice input'}
                  title={memoryVoice.supported ? 'Voice input' : 'Voice input is not supported by this browser'}
                  className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-full transition-colors ${memoryVoice.isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-primary text-white hover:bg-primary-light'} disabled:opacity-40`}
                >
                  {memoryVoice.isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              </div>
              {memoryVoice.isListening && <p className="-mt-2 text-xs font-semibold text-primary animate-pulse">Listening… speak when ready.</p>}

              {memoryError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{memoryError}</span>
                </div>
              )}

              <button
                onClick={handleSaveMemory}
                disabled={savingMemory || !memoryText.trim()}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.99] text-white font-extrabold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingMemory ? (
                  <span>Saving Memory Note...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    <span>{displayLanguage === 'ml' ? 'ഓർമ്മ സേവ് ചെയ്യുക' : 'Save Memory Note'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Memory Search Bar */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
              <form onSubmit={handleSearchMemory} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      displayLanguage === 'ml'
                        ? 'ഓർമ്മകളിൽ തിരയുക...'
                        : 'Search your memories (e.g. "where are my keys?")...'
                    }
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searchingMemory || !searchQuery.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#7C3AED] text-white text-xs font-bold hover:bg-[#6D28D9] disabled:opacity-50"
                >
                  {searchingMemory ? 'Searching...' : 'Search'}
                </button>
              </form>

              {/* Search Results Display */}
              {searchResults && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#7C3AED] uppercase">
                      Similarity Search Results ({searchResults.length})
                    </span>
                    <button
                      onClick={handleClearSearch}
                      className="text-xs text-gray-400 hover:text-gray-600 underline"
                    >
                      Clear Search
                    </button>
                  </div>

                  {searchResults.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2 text-center">No matching memories found above similarity threshold.</p>
                  ) : (
                    searchResults.map((res) => (
                      <div
                        key={res.id}
                        className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-purple-700 dark:text-purple-300 font-bold">
                          <span>{Math.round((res.similarity || 0) * 100)}% Match</span>
                          <span className="text-[10px] text-gray-400">{new Date(res.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 font-medium">{res.content}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* All Saved Memory Notes List */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 px-1">
                {displayLanguage === 'ml' ? 'എല്ലാ ഓർമ്മ കുറിപ്പുകളും' : 'All Saved Memory Notes'}
              </h3>

              {loadingMemory ? (
                <div className="text-center py-8 text-gray-400 text-sm">Loading memories...</div>
              ) : memoryNotes.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-3xl bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 text-gray-400 text-sm">
                  No memory notes saved yet. Add your first note above!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {memoryNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-[#7C3AED] flex items-center justify-center shrink-0 mt-0.5">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{note.content}</p>
                        <span className="text-[11px] text-gray-400 mt-1 block">
                          {new Date(note.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
