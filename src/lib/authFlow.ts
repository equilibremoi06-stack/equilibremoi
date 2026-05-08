import { getSupabase } from './supabaseClient';

type AuthUserLike = {
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


export function isUserAdminFromMetadata(
  user: AuthUserLike
): boolean {
  if (!user) return false;


  const appRole = user.app_metadata?.role;
  const userRole = user.user_metadata?.role;
  const appAdmin = user.app_metadata?.is_admin ?? user.app_metadata?.isAdmin;
  const userAdmin = user.user_metadata?.is_admin ?? user.user_metadata?.isAdmin;


  return (
    user.email === 'equilibremoi.06@gmail.com' ||
    appRole === 'admin' ||
    userRole === 'admin' ||
    appAdmin === true ||
    userAdmin === true
  );
}


export async function getCurrentUser() {
  const supabase = getSupabase();


  if (!supabase) {
    return null;
  }


  const { data, error } = await supabase.auth.getUser();


  if (error) {
    return null;
  }


  return data.user ?? null;
}


export function resolveUserAccess(
  user: AuthUserLike
): UserAccess {
  const isAdmin = isUserAdminFromMetadata(user);


  const premium =
    user?.app_metadata?.premium === true ||
    user?.user_metadata?.premium === true ||
    user?.app_metadata?.isPremium === true ||
    user?.user_metadata?.isPremium === true;


  const role =
    typeof user?.app_metadata?.role === 'string'
      ? user.app_metadata.role
      : typeof user?.user_metadata?.role === 'string'
        ? user.user_metadata.role
        : null;


  return {
    isAuthenticated: Boolean(user),
    isAdmin,
    isPremium: Boolean(premium || isAdmin),
    role,
  };
}

export function applyUserFlags(user: AuthUserLike): void {
  const access = resolveUserAccess(user);
  localStorage.setItem('isPremium', access.isPremium ? 'true' : 'false');
  localStorage.setItem('isAdmin', access.isAdmin ? 'true' : 'false');
  if (access.role) {
    localStorage.setItem('userRole', access.role);
  }
}

export async function syncPremiumStatus(user: AuthUserLike): Promise<boolean> {
  const access = resolveUserAccess(user);
  localStorage.setItem('isPremium', access.isPremium ? 'true' : 'false');
  localStorage.setItem('isAdmin', access.isAdmin ? 'true' : 'false');
  return access.isPremium;
}