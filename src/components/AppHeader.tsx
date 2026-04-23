import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabaseClient';
import AvatarUser from './AvatarUser';

export function AppHeader() {
  const supabase = getSupabase();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const showAvatar = Boolean(user) && location.pathname === '/app';

  return (
    <header className="w-full border-b border-[#F6E3E7] bg-[#FAF7F2]">
      <div className="mx-auto flex w-full max-w-[1126px] items-center justify-between px-6 py-4">
        <div>
          <h1 className="m-0 font-['Cormorant_Garamond',serif] text-2xl font-semibold leading-none text-[#1A2E22]">EquilibreMoi</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#7A8C82]">bien-être féminin</p>
        </div>
        <div className="ml-auto flex items-center">{showAvatar ? <AvatarUser user={user} /> : null}</div>
      </div>
    </header>
  );
}
