import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Failsafe: if credentials are missing or invalid, don't crash the entire app.
// We'll return a mock client or a limited one.
const isValidUrl = (urlString) => {
    try { return Boolean(new URL(urlString)); } catch (e) { return false; }
};

export const supabase = (isValidUrl(supabaseUrl) && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        from: () => ({
            select: () => ({ data: [], error: null }),
            insert: () => ({ error: { message: 'Supabase not configured' } }),
        }),
        channel: () => ({
            on: () => ({ subscribe: () => { } }),
            subscribe: () => { }
        })
    };
