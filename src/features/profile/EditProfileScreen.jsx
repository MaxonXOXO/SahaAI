import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Check, Loader2 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Button from '../../shared/components/Button';
import useProfileStore from '../../store/useProfileStore';
import useSettingsStore from '../../store/useSettingsStore';
import { translate } from '../../shared/lib/translations';
import { supabase } from '../../shared/lib/supabaseClient';

// ─── Crop helper ────────────────────────────────────────────────────────────
function getCroppedImg(imageSrc, pixelCrop) {
    return new Promise((resolve) => {
        const image = new Image();
        image.src = imageSrc;
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = pixelCrop.width;
            canvas.height = pixelCrop.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(
                image,
                pixelCrop.x, pixelCrop.y,
                pixelCrop.width, pixelCrop.height,
                0, 0,
                pixelCrop.width, pixelCrop.height
            );
            resolve(canvas.toDataURL('image/jpeg', 0.75));
        };
    });
}

const PRONOUN_OPTIONS = [
    { value: 'He/Him', labelEn: 'He/Him', labelMl: 'അവൻ' },
    { value: 'She/Her', labelEn: 'She/Her', labelMl: 'അവൾ' },
    { value: 'They/Them', labelEn: 'They/Them', labelMl: 'അവർ' },
    { value: 'He/They', labelEn: 'He/They', labelMl: 'അവൻ/അവർ' },
    { value: 'She/They', labelEn: 'She/They', labelMl: 'അവൾ/അവർ' },
    { value: 'Prefer not to say', labelEn: 'Prefer not to say', labelMl: 'പറയാൻ താല്പര്യമില്ല' }
];

const GENDER_OPTIONS = [
    { value: 'Male', labelEn: 'Male', labelMl: 'പുരുഷൻ' },
    { value: 'Female', labelEn: 'Female', labelMl: 'സ്ത്രീ' },
    { value: 'Non-binary', labelEn: 'Non-binary', labelMl: 'നോൺ-ബൈനറി' },
    { value: 'Genderfluid', labelEn: 'Genderfluid', labelMl: 'ജെൻഡർ ഫ്ലൂയിഡ്' },
    { value: 'Prefer not to say', labelEn: 'Prefer not to say', labelMl: 'പറയാൻ താല്പര്യമില്ല' },
    { value: 'Prefer to self-describe', labelEn: 'Prefer to self-describe', labelMl: 'സ്വയം വിശേഷിപ്പിക്കാൻ താല്പര്യപ്പെടുന്നു' }
];

// ─── Input helper ────────────────────────────────────────────────────────────
function Field({ label, sublabel, children }) {
    return (
        <div className="flex flex-col gap-1.5">
            <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</label>
                {sublabel && <p className="text-xs text-gray-400 dark:text-gray-500">{sublabel}</p>}
            </div>
            {children}
        </div>
    );
}

// ─── Text Input helper ────────────────────────────────────────────────────────────
function TextInput({ value, onChange, placeholder, disabled, multiline }) {
    const cls = "w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-primary/60 transition-colors resize-none";
    return multiline
        ? <textarea className={cls} value={value} onChange={onChange} placeholder={placeholder} rows={3} />
        : <input className={`${cls} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} />;
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function EditProfileScreen() {
    const navigate = useNavigate();
    const profile = useProfileStore();
    const updateProfile = useProfileStore((s) => s.updateProfile);

    // Local form state (so we don't mutate store until save)
    const [form, setForm] = useState({
        name: profile.name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        pronouns: profile.pronouns || '',
        gender: profile.gender || '',
        primaryMode: profile.primaryMode || '',
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // ── Avatar / crop state ──
    const fileRef = useRef();
    const [rawImage, setRawImage] = useState(null);   // original for crop
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedArea, setCroppedArea] = useState(null);
    const [cropping, setCropping] = useState(false);    // show crop UI
    const [preview, setPreview] = useState(profile.avatar_base64 || null);

    const handleField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    // Automatically sync primaryMode based on store for saving if needed, but not edited here anymore.

    // ── Image pick ──
    const handleFilePick = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setRawImage(reader.result);
            setCropping(true);
        };
        reader.readAsDataURL(file);
    };

    const onCropComplete = useCallback((_, pixels) => setCroppedArea(pixels), []);

    const handleCropConfirm = async () => {
        if (!rawImage || !croppedArea) return;
        const base64 = await getCroppedImg(rawImage, croppedArea);
        setPreview(base64);
        setCropping(false);
        setRawImage(null);
    };

    // ── Save ──
    const handleSave = async () => {
        setSaving(true);

        // Collect final values
        const updates = {
            name: form.name,
            username: form.username,
            bio: form.bio,
            pronouns: form.pronouns,
            gender: form.gender,
            avatar_base64: preview || profile.avatar_base64 || '',
            primary_mode: form.primaryMode || null,
        };

        // Direct Supabase update to make sure it lands
        const { data: { session } } = await supabase.auth.getSession();
        const uid = profile.id || session?.user?.id;

        if (uid) {
            await supabase.from('profiles').update(updates).eq('id', uid);
        }

        // Update Zustand store (mapping key correctly to camelCase primaryMode)
        await updateProfile({
            name: form.name,
            username: form.username,
            bio: form.bio,
            pronouns: form.pronouns,
            gender: form.gender,
            avatar_base64: preview || profile.avatar_base64 || '',
            primaryMode: form.primaryMode || null,
        });

        setSaving(false);
        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            navigate('/profile');
        }, 900);
    };

    // ─── Crop UI overlay ─────────────────────────────────────────────────────
    if (cropping && rawImage) {
        return (
            <div className="absolute inset-0 bg-black z-50 flex flex-col">
                <div className="relative flex-1">
                    <Cropper
                        image={rawImage}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>
                <div className="flex flex-col gap-3 p-5 bg-black">
                    <input
                        type="range" min={1} max={3} step={0.05} value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full accent-primary"
                    />
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setCropping(false); setRawImage(null); }}
                            className="flex-1 py-3 rounded-xl border-2 border-gray-600 text-white text-base-sm font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCropConfirm}
                            className="flex-1 py-3 rounded-xl bg-primary text-white text-base-sm font-semibold"
                        >
                            Use Photo
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const { displayLanguage } = useSettingsStore();

    // ─── Main form ───────────────────────────────────────────────────────────
    return (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-y-auto">
            <ScreenHeader
                title={translate('editProfile', displayLanguage)}
                rightAction={
                    <button
                        onClick={handleSave}
                        disabled={saving || saved}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-full"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
                        {saving ? (displayLanguage === 'ml' ? 'സേവ് ചെയ്യുന്നു...' : 'Saving...') : saved ? (displayLanguage === 'ml' ? 'സേവ് ചെയ്തു!' : 'Saved!') : (displayLanguage === 'ml' ? 'സേവ് ചെയ്യുക' : 'Save')}
                    </button>
                }
            />

            <div className="flex flex-col gap-6 px-4 py-6">
                {/* ── Avatar section ── */}
                <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                        {preview ? (
                            <img
                                src={preview}
                                alt="Profile"
                                className="w-24 h-24 rounded-full object-cover border-4 border-primary/30 shadow-lg"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-primary/30 flex items-center justify-center text-primary font-bold text-2xl uppercase shadow-lg">
                                {form.name ? form.name.slice(0, 2) : form.username ? form.username.slice(0, 2) : 'US'}
                            </div>
                        )}
                        <button
                            onClick={() => fileRef.current?.click()}
                            className="absolute -bottom-1 -right-1 w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-gray-900"
                        >
                            <Camera size={16} className="text-white" />
                        </button>
                    </div>
                    <button
                        onClick={() => fileRef.current?.click()}
                        className="text-primary text-base-sm font-semibold"
                    >
                        {displayLanguage === 'ml' ? 'ഫോട്ടോ മാറ്റുക' : 'Change Photo'}
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFilePick} />
                </div>

                {/* ── Section: Basic Info ── */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {displayLanguage === 'ml' ? 'അടിസ്ഥാന വിവരങ്ങൾ' : 'Basic Info'}
                    </p>

                    <Field label={displayLanguage === 'ml' ? 'പേര്' : 'Display Name'}>
                        <TextInput value={form.name} onChange={handleField('name')} placeholder={displayLanguage === 'ml' ? 'നിങ്ങളുടെ മുഴുവൻ പേര്' : 'Your full name'} />
                    </Field>

                    <Field label={displayLanguage === 'ml' ? 'യൂസർനെയിം' : 'Username'}>
                        <div className="flex items-center bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden focus-within:border-primary/60 transition-colors">
                            <span className="pl-4 text-gray-400 font-semibold text-base-sm select-none">@</span>
                            <input
                                className="flex-1 bg-transparent outline-none px-2 py-3 text-base-sm text-gray-800 dark:text-gray-100"
                                value={form.username}
                                onChange={handleField('username')}
                                placeholder="yourusername"
                                autoCapitalize="none"
                            />
                        </div>
                    </Field>

                    <Field label={displayLanguage === 'ml' ? 'ഇമെയിൽ' : 'Email'} sublabel={displayLanguage === 'ml' ? 'ഇവിടെ മാറ്റാൻ കഴിയില്ല' : 'Cannot be changed here'}>
                        <TextInput value={profile.email || ''} disabled placeholder="your@email.com" />
                    </Field>

                    <Field label={displayLanguage === 'ml' ? 'ബയോ (Bio)' : 'Bio'} sublabel={displayLanguage === 'ml' ? 'ചെറിയ വിവരണം - നിങ്ങളെ നന്നായി മനസ്സിലാക്കാൻ സഹായകരമാകും' : 'A short intro — helps SahaAI understand you better'}>
                        <TextInput
                            multiline
                            value={form.bio}
                            onChange={handleField('bio')}
                            placeholder={displayLanguage === 'ml' ? 'നിങ്ങളെക്കുറിച്ച് പറയുക...' : "Tell us about yourself... (e.g. I'm a 9th grader who loves art and finds reading tough)"}
                        />
                    </Field>
                </div>

                {/* ── Section: Identity ── */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {displayLanguage === 'ml' ? 'സ്വത്വ വിവരം' : 'Identity'}
                    </p>

                    <Field label={displayLanguage === 'ml' ? 'സർവ്വനാമം (Pronouns)' : 'Pronouns'}>
                        <div className="flex flex-wrap gap-2">
                            {PRONOUN_OPTIONS.map((p) => (
                                <button
                                    key={p.value}
                                    onClick={() => setForm((f) => ({ ...f, pronouns: f.pronouns === p.value ? '' : p.value }))}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${
                                        form.pronouns === p.value
                                            ? 'bg-primary border-primary text-white'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary/40'
                                    }`}
                                >
                                    {displayLanguage === 'ml' ? p.labelMl : p.labelEn}
                                </button>
                            ))}
                        </div>
                    </Field>

                    <Field label={displayLanguage === 'ml' ? 'ലിംഗഭേദം (Gender)' : 'Gender'}>
                        <div className="flex flex-wrap gap-2">
                            {GENDER_OPTIONS.map((g) => (
                                <button
                                    key={g.value}
                                    onClick={() => setForm((f) => ({ ...f, gender: f.gender === g.value ? '' : g.value }))}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${
                                        form.gender === g.value
                                            ? 'bg-primary border-primary text-white'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary/40'
                                    }`}
                                >
                                    {displayLanguage === 'ml' ? g.labelMl : g.labelEn}
                                </button>
                            ))}
                        </div>
                    </Field>
                </div>

                <Button onClick={handleSave} disabled={saving || saved} className="w-full">
                    {saving ? (displayLanguage === 'ml' ? 'സേവ് ചെയ്യുന്നു...' : 'Saving...') : saved ? (displayLanguage === 'ml' ? '✓ സേവ് ചെയ്തു!' : '✓ Saved!') : (displayLanguage === 'ml' ? 'മാറ്റങ്ങൾ സേവ് ചെയ്യുക' : 'Save Changes')}
                </Button>
            </div>
        </div>
    );
}
