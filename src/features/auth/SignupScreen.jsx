import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import Button from '../../shared/components/Button';
import useProfileStore from '../../store/useProfileStore';

export default function SignupScreen() {
    const navigate = useNavigate();
    const signup = useProfileStore((s) => s.signup);
    const loading = useProfileStore((s) => s.loading);

    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');

    const handleChange = (key) => (e) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.username.trim() || !form.email.trim() || !form.password) {
            setError('Please fill in all fields.');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        const result = await signup(form);

        if (!result.success) {
            // Postgres unique constraint violation surfaces like this
            if (result.error?.toLowerCase().includes('duplicate') || result.error?.toLowerCase().includes('unique')) {
                setError('That username is already taken. Try another.');
            } else {
                setError(result.error || 'Something went wrong. Please try again.');
            }
            return;
        }

        navigate('/language');
    };

    return (
        <div className="flex-1 flex flex-col justify-center px-6 py-8">
            <h1 className="text-base-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
                Create your account
            </h1>
            <p className="text-base-sm text-gray-400 mb-6">
                One AI Assistant. Many Accessibility Needs.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label className="text-base-sm font-medium text-gray-600 dark:text-gray-300 mb-1 block">
                        Username
                    </label>
                    <div className="flex items-center border-2 border-gray-200 dark:border-gray-700 rounded-card px-3">
                        <User size={18} className="text-gray-400" />
                        <input
                            type="text"
                            value={form.username}
                            onChange={handleChange('username')}
                            placeholder="yourusername"
                            className="flex-1 bg-transparent outline-none px-2 py-3 text-base-sm text-gray-800 dark:text-gray-100"
                            autoCapitalize="none"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-base-sm font-medium text-gray-600 dark:text-gray-300 mb-1 block">
                        Email
                    </label>
                    <div className="flex items-center border-2 border-gray-200 dark:border-gray-700 rounded-card px-3">
                        <Mail size={18} className="text-gray-400" />
                        <input
                            type="email"
                            value={form.email}
                            onChange={handleChange('email')}
                            placeholder="you@example.com"
                            className="flex-1 bg-transparent outline-none px-2 py-3 text-base-sm text-gray-800 dark:text-gray-100"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-base-sm font-medium text-gray-600 dark:text-gray-300 mb-1 block">
                        Password
                    </label>
                    <div className="flex items-center border-2 border-gray-200 dark:border-gray-700 rounded-card px-3">
                        <Lock size={18} className="text-gray-400" />
                        <input
                            type="password"
                            value={form.password}
                            onChange={handleChange('password')}
                            placeholder="At least 6 characters"
                            className="flex-1 bg-transparent outline-none px-2 py-3 text-base-sm text-gray-800 dark:text-gray-100"
                        />
                    </div>
                </div>

                {error && (
                    <p className="text-base-sm text-red-500">{error}</p>
                )}

                <Button type="submit" disabled={loading} className="mt-2 w-full">
                    {loading ? 'Creating account...' : 'Get Started'}
                </Button>
            </form>

            <p className="text-base-sm text-gray-400 text-center mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-semibold">
                    Log in
                </Link>
            </p>
        </div>
    );
}