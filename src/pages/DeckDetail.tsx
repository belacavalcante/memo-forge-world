import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, Play } from "lucide-react";
import { toast } from "sonner";

export default function DeckDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [deck, setDeck] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  const load = async () => {
    if (!id) return;
    const [{ data: dk }, { data: cs }] = await Promise.all([
      supabase.from("decks").select("*").eq("id", id).maybeSingle(),
      supabase.from("flashcards").select("*").eq("deck_id", id).order("created_at", { ascending: false }),
    ]);
    setDeck(dk); setCards(cs ?? []);
  };
  useEffect(() => { load(); }, [id]);

  const add = async () => {
    if (!front.trim() || !back.trim() || !user || !id) return;
    const { error } = await supabase.from("flashcards").insert({ front, back, deck_id: id, user_id: user.id });
    if (error) return toast.error(error.message);
    setFront(""); setBack(""); setOpen(false); load();
  };

  const remove = async (cid: string) => {
    await supabase.from("flashcards").delete().eq("id", cid);
    load();
  };

  if (!deck) return <div className="container py-8">Carregando...</div>;

  return (
    <div className="container max-w-4xl py-8 animate-fade-in">
      <Link to={deck.subject_id ? `/app/subjects/${deck.subject_id}` : "/app/subjects"} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{deck.name}</h1>
          <p className="text-sm text-muted-foreground">{cards.length} flashcards</p>
        </div>
        <div className="flex gap-2">
          <Button asChild><Link to={`/app/study?deck=${deck.id}`}><Play className="h-4 w-4 mr-1" /> Estudar</Link></Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-1" /> Card</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo flashcard</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Pergunta</Label><Textarea value={front} onChange={e => setFront(e.target.value)} /></div>
                <div><Label>Resposta</Label><Textarea value={back} onChange={e => setBack(e.target.value)} /></div>
              </div>
              <DialogFooter><Button onClick={add}>Adicionar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="space-y-2">
        {cards.map(c => (
          <Card key={c.id} className="p-4 flex justify-between items-start gap-3 group">
            <div className="flex-1 min-w-0">
              <p className="font-medium">{c.front}</p>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.back}</p>
            </div>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => remove(c.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}