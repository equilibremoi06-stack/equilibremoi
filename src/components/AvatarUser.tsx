import { useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '../lib/supabaseClient';

type AvatarUserProps = {
  user: User | null;
};

export default function AvatarUser({ user }: AvatarUserProps) {
  const supabase = getSupabase();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const letter = useMemo(() => {
    const first =
      user?.email?.[0] ||
      (typeof user?.user_metadata?.first_name === 'string' ? user.user_metadata.first_name[0] : '') ||
      (typeof user?.user_metadata?.name === 'string' ? user.user_metadata.name[0] : '') ||
      'E';
    return first.toUpperCase();
  }, [user]);

  const displayEmail = user?.email || 'utilisatrice';

  const onSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    localStorage.removeItem('isPremium');
    localStorage.removeItem('equilibremoi_is_admin');
    setOpen(false);
    navigate('/auth', { replace: true });
  };

  const onProfile = () => {
    setOpen(false);
    navigate('/app?tab=profil');
  };

  if (!user) return null;

  return (
    <div className="relative mr-4 flex items-center" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[#1A2E22] bg-gradient-to-br from-[#F2A7B0] via-[#FAF7F2] to-[#C8A44A] border border-white shadow-[0_8px_20px_rgba(26,46,34,0.12)] overflow-hidden hover:scale-[1.03] transition"
      >
        {letter}
      </button>

      {open ? (
        <div className="absolute right-0 top-full mt-3 min-w-[220px] bg-white/95 backdrop-blur-sm rounded-2xl border border-[#F6E3E7] shadow-[0_18px_40px_rgba(26,46,34,0.14)] p-2 z-50">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2">
            <span className="h-8 w-8 rounded-full border border-white overflow-hidden bg-gradient-to-br from-[#F2A7B0] via-[#FAF7F2] to-[#C8A44A] text-[#1A2E22] font-bold flex items-center justify-center">
              {letter}
            </span>
            <span className="max-w-[150px] truncate text-xs font-medium text-[#7A8C82]">{displayEmail}</span>
          </div>
          <div className="my-1 h-px bg-[#F6E3E7]" />
          <button
            type="button"
            onClick={onProfile}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-[#1A2E22] transition hover:bg-[#FAF7F2]"
          >
            Mon profil
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-[#F87171] transition hover:bg-[#FEF2F2] hover:text-[#D35F7A]"
          >
            Se déconnecter
          </button>
        </div>
      ) : null}
    </div>
  );
}
