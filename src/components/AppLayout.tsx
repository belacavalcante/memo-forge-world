import { Outlet, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Trophy } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

export const AppLayout = () => {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<{ xp: number; level: number; current_streak: number; display_name: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("xp, level, current_streak, display_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
    const channel = supabase
      .channel("profile-updates")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload) => setProfile(payload.new as any))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Skeleton className="h-12 w-48" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center justify-between px-4 bg-card/50 backdrop-blur sticky top-0 z-10">
            <SidebarTrigger />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/10 text-warning-foreground border border-warning/20">
                <Flame className="h-4 w-4 text-warning" />
                <span className="text-sm font-semibold">{profile?.current_streak ?? 0}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-soft text-primary">
                <Trophy className="h-4 w-4" />
                <span className="text-sm font-semibold">Nv {profile?.level ?? 1} · {profile?.xp ?? 0} XP</span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto"><Outlet /></main>
        </div>
      </div>
    </SidebarProvider>
  );
};