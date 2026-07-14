import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isPlaceholder = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder');

if (isPlaceholder) {
    console.warn(
        'Warning: Missing or placeholder Supabase env vars. Please check your .env file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set.'
    );
}

// Fallback to placeholder values to prevent createClient from crashing the application at load time.
const clientUrl = supabaseUrl || 'https://placeholder-project.supabase.co';
const clientKey = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(clientUrl, clientKey);