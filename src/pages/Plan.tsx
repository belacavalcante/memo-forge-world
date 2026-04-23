import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, Target } from "lucide-react";
import { toast } from "sonner";

export default function Plan() {
  const { user } = useAuth();
  const [goal, setGoal] = useState("");
  const [dailyCards, setDailyCards] = useState(20);
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("study_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => { if (data) { setPlan(data.ai_plan); setDailyCards(data.daily_cards_goal); setDailyMinutes(data.daily_minutes_goal); } });
  }, [user]);

  const generate = async () => {
    if (!goal.trim() || !user) return;
    setLoading(true);
    const prompt = `Objetivo do aluno: ${goal}\nMetas diárias: ${dailyCards} flashcards, ${dailyMinutes} minutos de estudo.\nMonte um plano de 4 semanas, prático, motivador e realista.`;
    const { data, error } = await supabase.functions.invoke("ai-generate", {
      body: { mode: "study_plan", content: prompt },
    });
    if (error || data?.error) { toast.error(data?.error || "Erro"); setLoading(false); return; }
    setPlan(data);
    await supabase.from("study_plans").insert({
      user_id: user.id, title: goal.slice(0, 80), description: goal,
      daily_cards_goal: dailyCards, daily_minutes_goal: dailyMinutes, ai_plan: data,
    });
    toast.success("Plano gerado!");
    setLoading(false);
  };

  return (
    <div className="container max-w-3xl py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold flex items-center gap-2"><Target className="h-7 w-7 text-primary" /> Plano de estudos</h1>
        <p className="text-muted-foreground mt-1">A IA monta um plano personalizado pra você.</p>
      </div>

      <Card className="p-6 mb-6 space-y-4">
        <div className="space-y-2">
          <Label>Qual seu objetivo?</Label>
          <Textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="Ex: Passar no ENEM em medicina, foco em ciências da natureza" rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Flashcards/dia</Label><Input type="number" value={dailyCards} onChange={e => setDailyCards(+e.target.value)} /></div>
          <div className="space-y-2"><Label>Minutos/dia</Label><Input type="number" value={dailyMinutes} onChange={e => setDailyMinutes(+e.target.value)} /></div>
        </div>
        <Button onClick={generate} disabled={loading || !goal.trim()} className="w-full shadow-glow">
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Gerar plano com IA
        </Button>
      </Card>

      {plan?.weeks && (
        <div className="space-y-4 animate-fade-in">
          {plan.weeks.map((w: any) => (
            <Card key={w.week} className="p-5">
              <h3 className="font-semibold text-lg">Semana {w.week} · {w.focus}</h3>
              <div className="mt-3 space-y-2">
                {w.days.map((d: any, i: number) => (
                  <div key={i} className="border-l-2 border-primary/30 pl-3 py-1">
                    <p className="text-sm font-medium">{d.day}</p>
                    <ul className="text-sm text-muted-foreground list-disc ml-4 mt-1">
                      {d.tasks.map((t: string, j: number) => <li key={j}>{t}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}