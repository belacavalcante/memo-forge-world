import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Layers, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function SubjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [subject, setSubject] = useState<any>(null);
  const [decks, setDecks] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const load = async () => {
    if (!id) return;
    const [{ data: s }, { data: d }] = await Promise.all([
      supabase.from("subjects").select("*").eq("id", id).maybeSingle(),
      supabase.from("decks").select("*, flashcards(count)").eq("subject_id", id).order("created_at", { ascending: false }),
    ]);
    setSubject(s);
    setDecks(d ?? []);
  };
  useEffect(() => { load(); }, [id]);

  const create = async () => {
    if (!name.trim() || !user || !id) return;
    const { error } = await supabase.from("decks").insert({ name: name.trim(), subject_id: id, user_id: user.id });
    if (error) return toast.error(error.message);
    setName(""); setOpen(false); load();
  };

  if (!subject) return <div className="container py-8">Carregando...</div>;

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <Link to="/app/subjects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Matérias
      </Link>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: subject.color + "20", color: subject.color }}>
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{subject.name}</h1>
            {subject.description && <p className="text-sm text-muted-foreground">{subject.description}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/app/create"><Sparkles className="h-4 w-4 mr-1" /> Gerar com IA</Link></Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Novo deck</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo deck</DialogTitle></DialogHeader>
              <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Trigonometria" /></div>
              <DialogFooter><Button onClick={create}>Criar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {decks.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Layers className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">Nenhum deck ainda</h3>
          <p className="text-sm text-muted-foreground mb-4">Crie um deck ou gere flashcards com IA.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {decks.map((d: any) => (
            <Link key={d.id} to={`/app/decks/${d.id}`}>
              <Card className="p-5 hover:shadow-soft transition-smooth">
                <h3 className="font-semibold">{d.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{d.flashcards?.[0]?.count ?? 0} flashcards</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}