import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mic, Square, RotateCw, Sparkles, Trophy } from "lucide-react";
import { nextReview } from "@/lib/srs";
import { toast } from "sonner";

export default function Study() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const deckId = params.get("deck");
  const [cards, setCards] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [done, setDone] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!user) return;
    let q = supabase.from("flashcards").select("*").eq("user_id", user.id).lte("due_at", new Date().toISOString()).order("due_at").limit(30);
    if (deckId) q = q.eq("deck_id", deckId);
    q.then(({ data }) => setCards(data ?? []));
  }, [user, deckId]);

  const card = cards[idx];

  const grade = async (difficulty: "easy" | "medium" | "hard") => {
    if (!card || !user) return;
    const updates = nextReview(card, difficulty);
    await Promise.all([
      supabase.from("flashcards").update(updates).eq("id", card.id),
      supabase.from("flashcard_reviews").insert({ flashcard_id: card.id, user_id: user.id, difficulty }),
      supabase.rpc("award_xp", { _user_id: user.id, _xp: difficulty === "hard" ? 5 : difficulty === "medium" ? 8 : 12, _activity: "flashcard_review", _metadata: { card_id: card.id, difficulty } as any }),
    ]);
    setShowBack(false);
    setAudioUrl(null);
    if (idx + 1 >= cards.length) setDone(true);
    else setIdx(idx + 1);
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = e => chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      toast.error("Não foi possível acessar o microfone");
    }
  };

  const stopRec = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  if (!user) return null;

  if (cards.length === 0) {
    return (
      <div className="container max-w-2xl py-16 text-center animate-fade-in">
        <Sparkles className="h-12 w-12 mx-auto text-primary mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Tudo em dia! 🎉</h1>
        <p className="text-muted-foreground mb-6">Você não tem flashcards para revisar agora. Crie novos ou volte mais tarde.</p>
        <Button asChild><a href="/app/create">Gerar mais com IA</a></Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="container max-w-2xl py-16 text-center animate-scale-in">
        <div className="gradient-primary inline-flex p-4 rounded-2xl shadow-glow mb-6">
          <Trophy className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-semibold mb-2">Sessão concluída!</h1>
        <p className="text-muted-foreground mb-6">Você revisou {cards.length} flashcards. Manda ver na próxima!</p>
        <Button onClick={() => window.location.reload()} className="shadow-glow">Estudar mais</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8 animate-fade-in">
      <div className="mb-4">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>{idx + 1} de {cards.length}</span>
          <span>{Math.round(((idx) / cards.length) * 100)}%</span>
        </div>
        <Progress value={((idx) / cards.length) * 100} className="h-1.5" />
      </div>

      <Card className="p-8 min-h-[280px] flex flex-col justify-center text-center shadow-soft mb-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">{showBack ? "Resposta" : "Pergunta"}</p>
        <p className="text-xl md:text-2xl font-medium text-balance">{showBack ? card.back : card.front}</p>
      </Card>

      <div className="flex items-center gap-2 mb-6 justify-center">
        {!recording ? (
          <Button variant="outline" size="sm" onClick={startRec}><Mic className="h-4 w-4 mr-1" /> Responder por áudio</Button>
        ) : (
          <Button variant="destructive" size="sm" onClick={stopRec}><Square className="h-4 w-4 mr-1" /> Parar</Button>
        )}
        {audioUrl && <audio src={audioUrl} controls className="h-9" />}
      </div>

      {!showBack ? (
        <Button onClick={() => setShowBack(true)} className="w-full h-12 shadow-glow text-base">
          <RotateCw className="h-4 w-4 mr-2" /> Mostrar resposta
        </Button>
      ) : (
        <div className="grid grid-cols-3 gap-2 animate-fade-in">
          <Button variant="outline" className="h-14 flex-col gap-0.5 border-destructive/30 hover:bg-destructive/10" onClick={() => grade("hard")}>
            <span className="font-semibold text-destructive">Difícil</span>
            <span className="text-xs text-muted-foreground">+5 XP</span>
          </Button>
          <Button variant="outline" className="h-14 flex-col gap-0.5 border-warning/30 hover:bg-warning/10" onClick={() => grade("medium")}>
            <span className="font-semibold">Médio</span>
            <span className="text-xs text-muted-foreground">+8 XP</span>
          </Button>
          <Button variant="outline" className="h-14 flex-col gap-0.5 border-success/30 hover:bg-success/10" onClick={() => grade("easy")}>
            <span className="font-semibold text-success">Fácil</span>
            <span className="text-xs text-muted-foreground">+12 XP</span>
          </Button>
        </div>
      )}
    </div>
  );
}