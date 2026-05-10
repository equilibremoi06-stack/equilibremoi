import type { User } from '@supabase/supabase-js';
import { getSupabase } from './supabaseClient';

export type UserParcours = 'classique' | 'menopause';

const PARCOURS_KEY = 'parcours';

export function isUserParcours(value: unknown): value is UserParcours {
  return value === 'classique' || value === 'menopause';
}

export function getStoredParcours(): UserParcours | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(PARCOURS_KEY);
  return isUserParcours(value) ? value : null;
}

export function setStoredParcours(parcours: UserParcours): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PARCOURS_KEY, parcours);
}

export async function syncSelectedParcoursSupabase(user: User | null | undefined): Promise<void> {
  if (!user) return;
  const parcours = getStoredParcours();
  if (!parcours) return;

  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.auth.updateUser({
    data: {
      parcours,
      parcours_type: parcours,
      selected_parcours: parcours,
    },
  });

  if (error) {
    console.warn('[EquilibreMoi] sync selected parcours', error.message);
  }
}
