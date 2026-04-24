import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Layers, Sparkles, Target, Users, Zap, ArrowRight, Plus } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ subjects: 0, decks: 0, dueCards: 0, todayReviews: 0 });
  const [name, setName] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [{ count: s }, { count: d }, { count: due }, { count: rev }, { data: prof }] = await Promise.all([
        supabase.from("subjects").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("decks").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("flashcards").select("*", { count: "exact", head: true }).eq("user_id", user.id).lte("due_at", new Date().toISOString()),
        supabase.from("flashcard_reviews").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("reviewed_at", today.toISOString()),
        supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
      ]);
      setStats({ subjects: s ?? 0, decks: d ?? 0, dueCards: due ?? 0, todayReviews: rev ?? 0 });
      setName(prof?.display_name ?? "");
    })();
  }, [user]);

  const goal = 20;
  const progress = Math.min(100, Math.round((stats.todayReviews / goal) * 100));

  return (
    <div className="container max-w-6xl py-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Olá, {name?.split(" ")[0] || "estudante"} 👋</h1>
        <p className="text-muted-foreground mt-1">Pronto para mais um dia de estudos?</p>
      </div>

      <Card className="p-6 gradient-soft border-primary/20">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
              <Zap className="h-4 w-4" /> Meta diária
            </div>
            <div className="text-3xl font-semibold">{stats.todayReviews} <span className="text-muted-foreground text-lg font-normal">/ {goal} cards revisados</span></div>
          </div>
          <Button asChild size="lg" className="shadow-glow"><Link to="/app/study">Estudar agora <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>
        <Progress value={progress} className="mt-4 h-2" />
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, label: "Matérias", value: stats.subjects, link: "/app/subjects", color: "primary" },
          { icon: Layers, label: "Decks", value: stats.decks, link: "/app/subjects", color: "accent" },
          { icon: Target, label: "Cards p/ revisar", value: stats.dueCards, link: "/app/study", color: "warning" },
          { icon: Sparkles, label: "Hoje", value: stats.todayReviews, link: "/app/study", color: "success" },
        ].map((s, i) => (
          <Link key={i} to={s.link}>
            <Card className="p-5 hover:shadow-soft transition-smooth hover:-translate-y-0.5">
              <s.icon className={`h-5 w-5 text-${s.color} mb-3`} />
              <div className="text-2xl font-semibold">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/app/create">
          <Card className="p-6 hover:shadow-glow transition-smooth h-full">
            <div className="bg-primary-soft text-primary inline-flex p-2.5 rounded-xl mb-4"><Sparkles className="h-5 w-5" /></div>
            <h3 className="font-semibold text-lg">Criar com IA</h3>
            <p className="text-sm text-muted-foreground mt-1">Cole texto, link do YouTube ou ideia. A IA gera flashcards, resumos, quizzes e mapas mentais.</p>
          </Card>
        </Link>
        <Link to="/app/groups">
          <Card className="p-6 hover:shadow-glow transition-smooth h-full">
            <div className="bg-accent-soft text-accent inline-flex p-2.5 rounded-xl mb-4"><Users className="h-5 w-5" /></div>
            <h3 className="font-semibold text-lg">Galera estudando</h3>
            <p className="text-sm text-muted-foreground mt-1">Entre nos grupos: pré-vestibular, IA, marketing, programação e mais.</p>
          </Card>
        </Link>
      </div>

      {stats.subjects === 0 && (
        <Card className="p-6 border-dashed">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-semibold">Comece criando uma matéria</h3>
              <p className="text-sm text-muted-foreground">Organize seus estudos por área (Matemática, Inglês...).</p>
            </div>
            <Button asChild><Link to="/app/subjects"><Plus className="h-4 w-4 mr-1" /> Nova matéria</Link></Button>
          </div>
        </Card>
      )}
    </div>
  );
}