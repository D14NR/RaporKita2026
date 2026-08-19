import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const projectRef = String(env.VITE_SUPABASE_UJI || '').trim();
const anonKey = String(env.VITE_SUPABASE_ANON_KEY_UJI || '').trim();

export const supabaseUji = projectRef && anonKey
  ? createClient(
      projectRef.startsWith('http') ? projectRef : `https://${projectRef}.supabase.co`,
      anonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )
  : null;