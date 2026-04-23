import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Trophy, Flame, Zap, Star, Target, BookOpen } from "lucide-react";

export default function Achievements() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("flashcard_reviews").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    ]).then(([{ data }, { count }]) => { setProfile(data); setReviewCount(count ?? 0); });
  }, [user]);

  const badges = [
    { icon: Flame, name: "Em chamas", desc: "Estude 7 dias seguidos", unlocked: (profile?.longest_streak ?? 0) >= 7 },
    { icon: Flame, name: "Imparável", desc: "30 dias seguidos", unlocked: (profile?.longest_streak ?? 0) >= 30 },
    { icon: Zap, name: "Primeira revisão", desc: "Revise seu primeiro card", unlocked: reviewCount >= 1 },
    { icon: Star, name: "100 cards", desc: "Revise 100 flashcards", unlocked: reviewCount >= 100 },
    { icon: BookOpen, name: "1000 cards", desc: "Revise 1000 flashcards", unlocked: reviewCount >= 1000 },
    { icon: Target, name: "Nível 5", desc: "Alcance o nível 5", unlocked: (profile?.level ?? 1) >= 5 },
    { icon: Trophy, name: "Nível 10", desc: "Alcance o nível 10", unlocked: (profile?.level ?? 1) >= 10 },
  ];

  return (
    <div className="container max-w-4xl py-8 animate-fade-in">
      <h1 className="text-3xl font-semibold flex items-center gap-2"><Trophy className="h-7 w-7 text-warning" /> Conquistas</h1>
      <p className="text-muted-foreground mt-1 mb-6">Sua jornada em números.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Card className="p-4 text-center">
          <div className="text-3xl font-semibold text-primary">{profile?.level ?? 1}</div>
          <div className="text-xs text-muted-foreground mt-1">Nível</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-semibold text-primary">{profile?.xp ?? 0}</div>
          <div className="text-xs text-muted-foreground mt-1">XP total</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-semibold text-warning">{profile?.current_streak ?? 0}🔥</div>
          <div className="text-xs text-muted-foreground mt-1">Streak atual</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-semibold">{reviewCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Cards revisados</div>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {badges.map((b, i) => (
          <Card key={i} className={`p-5 text-center transition-smooth ${b.unlocked ? "border-primary/30 shadow-soft" : "opacity-50"}`}>
            <div className={`inline-flex p-3 rounded-2xl mb-3 ${b.unlocked ? "gradient-primary text-primary-foreground shadow-glow" : "bg-muted"}`}>
              <b.icon className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-sm">{b.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{b.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}