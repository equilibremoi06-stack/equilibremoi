
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getSupabase } from "../../lib/supabaseClient";


type RequireAuthProps = {
  children: React.ReactNode;
};


export default function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);


  useEffect(() => {
    async function checkAuth() {
      const supabase = getSupabase();


      if (!supabase) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }


      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getUser();
      setIsAuthenticated(Boolean(data.user));
      setLoading(false);
    }


    checkAuth();
  }, []);


  if (loading) {
    return <div style={{ padding: 24 }}>Chargement...</div>;
  }


  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }


  return <>{children}</>;
}