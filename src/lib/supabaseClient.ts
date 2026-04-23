import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function decodeJwtHeader(token: string): Record<string, unknown> | null {
  try {
    const [headerRaw] = token.split('.');
    if (!headerRaw) return null;
    const base64 = headerRaw.replace(/-/g, '+').replace(/_/g, '/');
    const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`;
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function purgeUnsupportedSessionIfNeeded(url: string): void {
  if (typeof window === 'undefined') return;
  const host = url.replace(/^https?:\/\//, '').split('/')[0] ?? '';
  const projectRef = host.split('.')[0] ?? '';
  if (!projectRef) return;
  const storageKey = `sb-${projectRef}-auth-token`;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as
      | { access_token?: string; currentSession?: { access_token?: string } }
      | null;
    const token = parsed?.currentSession?.access_token ?? parsed?.access_token;
    if (!token) return;
    const header = decodeJwtHeader(token);
    if (header?.alg === 'ES256') {
      window.localStorage.removeItem(storageKey);
    }
  } catch {
    // ignore invalid persisted session format
  }
}

export function getSupabase(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anonKey) return null;
  if (!client) {
    purgeUnsupportedSessionIfNeeded(url);
    client = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
  }
  return client;
}
