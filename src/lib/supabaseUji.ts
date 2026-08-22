import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL_UJI = 'https://nkjqcypurlcvcgeinmvq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY_UJI = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ranFjeXB1cmxjdmNnZWlubXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODM2ODcsImV4cCI6MjA5NjI1OTY4N30.SZkqBdv0sGLuimwAo-2KTew6Y0oOgwLglaqCs7NfTXI';

const env = (import.meta as any).env || {};
const ujiEnvUrl = env.VITE_SUPABASE_UJI || env.VITE_SUPABASE_URL_UJI || DEFAULT_SUPABASE_URL_UJI;
let supabaseUjiUrl = DEFAULT_SUPABASE_URL_UJI;
if (ujiEnvUrl) {
  if (ujiEnvUrl.startsWith('http://') || ujiEnvUrl.startsWith('https://')) {
    supabaseUjiUrl = ujiEnvUrl;
  } else {
    supabaseUjiUrl = `https://${ujiEnvUrl}.supabase.co`;
  }
}

const supabaseUjiKey = env.VITE_SUPABASE_ANON_KEY_UJI || DEFAULT_SUPABASE_ANON_KEY_UJI;

export const supabaseUji = createClient(supabaseUjiUrl, supabaseUjiKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
