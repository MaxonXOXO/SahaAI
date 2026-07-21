import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import Button from '../../shared/components/Button';
import useProfileStore from '../../store/useProfileStore';

export default function LoginScreen() {
    const navigate = useNavigate();
    const login = useProfileStore((s) => s.login);
    const loading = useProfileStore((s) => s.loading);

    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    const handleChange = (key) => (e) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.email.trim() || !form.password) {
            setError('Please fill in all fields.');
            return;
        }

        const result = await login(form);

        if (!result.success) {
            setError('Invalid email or password.');
            return;
        }

        navigate('/home');
    };

    return (
        <div className="flex-1 flex flex-col justify-center px-6 py-8">
            <h1 className="text-base-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
                Welcome back
            </h1>
            <p className="text-base-sm text-gray-400 mb-6">
                Log in to continue where you left off.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                            placeholder="Your password"
                            className="flex-1 bg-transparent outline-none px-2 py-3 text-base-sm text-gray-800 dark:text-gray-100"
                        />
                    </div>
                </div>

                {error && (
                    <p className="text-base-sm text-red-500">{error}</p>
                )}

                <Button type="submit" disabled={loading} className="mt-2 w-full">
                    {loading ? 'Logging in...' : 'Log In'}
                </Button>
            </form>

            <p className="text-base-sm text-gray-400 text-center mt-6">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary font-semibold">
                    Sign up
                </Link>
            </p>
        </div>
    );
}