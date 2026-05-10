import { getSupabase } from './supabaseClient';
import type { User } from '@supabase/supabase-js';

export type AuthUserLike = {
  id?: string | null;
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
} | null | undefined;

export type UserAccess = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPremium: boolean;
  role: string | null;
};

export type ProfileAccessRow = {
  id?: string | null;
  email?: string | null;
  premium?: boolean | null;
  is_premium?: boolean | null;
  is_admin?: boolean | null;
  role?: string | null;
  subscription_type?: string | null;
};


/** Product entitlements: JWT + resolved access + row from `profiles` (single gate for Premium UI). */
export function hasPremiumEntitlements(
  access: UserAccess,
  profile: ProfileAccessRow | null | undefined
): boolean {
  const adminFromProfile =
    profile?.is_admin === true || profile?.role === 'admin';
  if (access.isAdmin || adminFromProfile) return true;
  if (access.isPremium) return true;
  if (!profile) return false;
  return Boolean(
    profile.premium === true ||
      profile.is_premium === true ||
      profile.subscription_type === 'premium'
  );
}


export function isUserAdminFromMetadata(
  user: AuthUserLike
): boolean {
  if (!user) return false;
  const email = user.email?.trim().toLowerCase();


  const appRole = user.app_metadata?.role;
  const userRole = user.user_metadata?.role;
  const appAdmin = user.app_metadata?.is_admin ?? user.app_metadata?.isAdmin;
  const userAdmin = user.user_metadata?.is_admin ?? user.user_metadata?.isAdmin;


  return (
    email === 'equilibremoi.06@gmail.com' ||
    appRole === 'admin' ||
    userRole === 'admin' ||
    appAdmin === true ||
    userAdmin === true
  );
}

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeStoredUser(value: unknown): NonNullable<AuthUserLike> | null {
  if (!value || typeof value !== 'object') return null;
  const user = value as AuthUserLike;
  if (!user?.email && !user?.id) return null;
  return user as NonNullable<AuthUserLike>;
}

export function getStoredAuthUserSnapshot(): NonNullable<AuthUserLike> | null {
  if (!canUseLocalStorage()) return null;

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith('sb-') || !key.endsWith('-auth-token')) continue;

    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) ?? '{}') as {
        user?: unknown;
        session?: { user?: unknown };
        currentSession?: { user?: unknown };
      };
      const user =
        normalizeStoredUser(parsed.currentSession?.user) ??
        normalizeStoredUser(parsed.session?.user) ??
        normalizeStoredUser(parsed.user);
      if (user) return user;
    } catch {
      // Ignore malformed Supabase cache entries.
    }
  }

  return null;
}


export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabase();


  if (!supabase) {
    return getStoredAuthUserSnapshot() as User | null;
  }


  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData.session?.user ?? (getStoredAuthUserSnapshot() as User | null);

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return sessionUser;
  }

  return data.user ?? sessionUser;
}


export function resolveUserAccess(
  user: AuthUserLike,
  profile?: ProfileAccessRow | null
): UserAccess {
  const email = user?.email?.trim().toLowerCase() ?? profile?.email?.trim().toLowerCase();
  const isAdmin =
    isUserAdminFromMetadata(user) ||
    profile?.is_admin === true ||
    profile?.role === 'admin' ||
    email === 'equilibremoi.06@gmail.com';


  const premium =
    user?.app_metadata?.premium === true ||
    user?.user_metadata?.premium === true ||
    user?.app_metadata?.isPremium === true ||
    user?.user_metadata?.isPremium === true ||
    profile?.premium === true ||
    profile?.is_premium === true ||
    profile?.subscription_type === 'premium';


  const metadataRole =
    typeof profile?.role === 'string'
      ? profile.role
      : typeof user?.app_metadata?.role === 'string'
      ? user.app_metadata.role
      : typeof user?.user_metadata?.role === 'string'
        ? user.user_metadata.role
        : null;
  const role = isAdmin ? 'admin' : metadataRole;


  return {
    isAuthenticated: Boolean(user),
    isAdmin,
    isPremium: Boolean(premium || isAdmin),
    role,
  };
}

export async function getCurrentUserAccess(
  userInput?: User | null
): Promise<{ user: User | null; access: UserAccess; profile: ProfileAccessRow | null }> {
  const user = userInput ?? await getCurrentUser();
  const supabase = getSupabase();
  let profile: ProfileAccessRow | null = null;

  if (supabase && user?.id) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, premium, is_premium, is_admin, role, subscription_type')
      .eq('id', user.id)
      .maybeSingle();

    if (!error) {
      profile = (data ?? null) as ProfileAccessRow | null;
    } else {
      console.warn('[authFlow] lecture profil accès échouée', error.message);
    }

    const email = user.email?.trim().toLowerCase();
    const shouldForceAdmin = email === 'equilibremoi.06@gmail.com';
    if (shouldForceAdmin && (!profile?.is_admin || !profile?.premium || profile?.role !== 'admin')) {
      const { data: upserted, error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email ?? profile?.email ?? null,
            premium: true,
            is_premium: true,
            is_admin: true,
            role: 'admin',
            subscription_type: 'premium',
            premium_updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select('id, email, premium, is_premium, is_admin, role, subscription_type')
        .maybeSingle();

      if (!upsertError) {
        profile = (upserted ?? profile) as ProfileAccessRow | null;
      } else {
        console.warn('[authFlow] upsert profil admin échoué', upsertError.message);
      }
    }
  }

  const access = resolveUserAccess(user ?? getStoredAuthUserSnapshot(), profile);
  applyUserFlags({ ...(user ?? {}), email: user?.email ?? profile?.email ?? null, app_metadata: user?.app_metadata, user_metadata: user?.user_metadata }, profile);
  return { user, access, profile };
}

export function applyUserFlags(user: AuthUserLike, profile?: ProfileAccessRow | null): void {
  if (!canUseLocalStorage()) return;
  const access = resolveUserAccess(user, profile);
  localStorage.setItem('isPremium', access.isPremium ? 'true' : 'false');
  localStorage.setItem('isAdmin', access.isAdmin ? 'true' : 'false');
  localStorage.setItem('equilibremoi_is_admin', access.isAdmin ? 'true' : 'false');
  localStorage.setItem('userRole', access.role ?? '');
}

export async function syncPremiumStatus(user: AuthUserLike): Promise<boolean> {
  const access = resolveUserAccess(user);
  if (!canUseLocalStorage()) return access.isPremium;
  localStorage.setItem('isPremium', access.isPremium ? 'true' : 'false');
  localStorage.setItem('isAdmin', access.isAdmin ? 'true' : 'false');
  localStorage.setItem('equilibremoi_is_admin', access.isAdmin ? 'true' : 'false');
  localStorage.setItem('userRole', access.role ?? '');
  return access.isPremium;
}