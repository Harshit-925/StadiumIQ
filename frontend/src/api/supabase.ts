import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[StadiumIQ] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Auth and persistence will not work until these are set.',
  );
}

/** Singleton Supabase client — handles auth sessions automatically */
export const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '', {
  auth: {
    // Store the session in localStorage so it survives page reloads
    persistSession: true,
    // Automatically refresh the JWT before it expires (1hr expiry)
    autoRefreshToken: true,
  },
});
