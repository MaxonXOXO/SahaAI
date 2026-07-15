import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Check, Loader2, BookOpen, Zap, Users, Calculator, Eye } from 'lucide-react';
import Cropper from 'react-easy-crop';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Button from '../../shared/components/Button';
import useProfileStore from '../../store/useProfileStore';
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

// ─── Needs meta ──────────────────────────────────────────────────────────────
const NEEDS_META = [
    { key: 'dyslexia', label: 'Dyslexia', Icon: BookOpen, color: 'bg-accent-dyslexia' },
    { key: 'adhd', label: 'ADHD', Icon: Zap, color: 'bg-accent-adhd' },
    { key: 'autism', label: 'Autism', Icon: Users, color: 'bg-accent-autism' },
    { key: 'dyscalculia', label: 'Dyscalculia', Icon: Calculator, color: 'bg-accent-dyscalculia' },
    { key: 'lowVision', label: 'Low Vision', Icon: Eye, color: 'bg-accent-lowvision' },
];

const PRONOUN_OPTIONS = ['He/Him', 'She/Her', 'They/Them', 'He/They', 'She/They', 'Prefer not to say'];
const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Genderfluid', 'Prefer not to say', 'Prefer to self-describe'];

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

    // Get active needs list
    const activeNeeds = Object.entries(profile.needs || {})
        .filter(([, active]) => active)
        .map(([key]) => key);

    // Automatically sync primaryMode if only 1 need is selected
    useEffect(() => {
        if (activeNeeds.length === 1 && form.primaryMode !== activeNeeds[0]) {
            setForm(f => ({ ...f, primaryMode: activeNeeds[0] }));
        } else if (activeNeeds.length === 0 && form.primaryMode !== '') {
            setForm(f => ({ ...f, primaryMode: '' }));
        }
    }, [activeNeeds, form.primaryMode]);

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
            <div className="fixed inset-0 bg-black z-50 flex flex-col">
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

    // ─── Main form ───────────────────────────────────────────────────────────
    return (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-y-auto">
            <ScreenHeader
                title="Edit Profile"
                rightAction={
                    <button
                        onClick={handleSave}
                        disabled={saving || saved}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-full"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
                        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
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
                        Change Photo
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFilePick} />
                </div>

                {/* ── Section: Basic Info ── */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Basic Info</p>

                    <Field label="Display Name">
                        <TextInput value={form.name} onChange={handleField('name')} placeholder="Your full name" />
                    </Field>

                    <Field label="Username">
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

                    <Field label="Email" sublabel="Cannot be changed here">
                        <TextInput value={profile.email || ''} disabled placeholder="your@email.com" />
                    </Field>

                    <Field label="Bio" sublabel="A short intro — helps SahaAI understand you better">
                        <TextInput
                            multiline
                            value={form.bio}
                            onChange={handleField('bio')}
                            placeholder="Tell us about yourself... (e.g. I'm a 9th grader who loves art and finds reading tough)"
                        />
                    </Field>
                </div>

                {/* ── Section: Identity ── */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Identity</p>

                    <Field label="Pronouns">
                        <div className="flex flex-wrap gap-2">
                            {PRONOUN_OPTIONS.map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setForm((f) => ({ ...f, pronouns: f.pronouns === p ? '' : p }))}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${
                                        form.pronouns === p
                                            ? 'bg-primary border-primary text-white'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary/40'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </Field>

                    <Field label="Gender">
                        <div className="flex flex-wrap gap-2">
                            {GENDER_OPTIONS.map((g) => (
                                <button
                                    key={g}
                                    onClick={() => setForm((f) => ({ ...f, gender: f.gender === g ? '' : g }))}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${
                                        form.gender === g
                                            ? 'bg-primary border-primary text-white'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary/40'
                                    }`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </Field>
                </div>

                {/* ── Section: Accessibility Profile ── */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Accessibility Needs</p>
                        <button
                            onClick={() => navigate('/profile-setup')}
                            className="text-xs text-primary font-semibold"
                        >
                            Edit →
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {NEEDS_META.map(({ key, label, Icon, color }) => (
                            <div
                                key={key}
                                className={`flex items-center gap-2 px-3 py-2 rounded-full ${
                                    profile.needs[key]
                                        ? `${color} text-white`
                                        : 'bg-gray-100 dark:bg-gray-750 text-gray-400'
                                }`}
                            >
                                <Icon size={14} />
                                <span className="text-xs font-semibold">{label}</span>
                            </div>
                        ))}
                    </div>
                    
                    {activeNeeds.length > 1 && (
                        <Field label="Primary Mode Focus" sublabel="Choose which need to optimize your home screen for">
                            <div className="flex flex-wrap gap-2 mt-1">
                                {activeNeeds.map((needKey) => {
                                    const meta = NEEDS_META.find(n => n.key === needKey);
                                    if (!meta) return null;
                                    const Icon = meta.Icon;
                                    const isSelected = form.primaryMode === needKey;
                                    return (
                                        <button
                                            key={needKey}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, primaryMode: needKey }))}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 transition-colors ${
                                                isSelected
                                                    ? 'bg-primary border-primary text-white'
                                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary/40'
                                            }`}
                                        >
                                            <Icon size={14} />
                                            <span className="text-xs font-semibold">{meta.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </Field>
                    )}
                </div>

                <Button onClick={handleSave} disabled={saving || saved} className="w-full">
                    {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
                </Button>
            </div>
        </div>
    );
}
