import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, BookOpen, Layers, Trash2 } from "lucide-react";
import { toast } from "sonner";

const colors = ["hsl(24 95% 55%)", "hsl(200 85% 50%)", "hsl(140 60% 45%)", "hsl(260 75% 60%)", "hsl(340 75% 55%)", "hsl(45 90% 55%)"];

interface Subject { id: string; name: string; description: string | null; color: string; }

export default function Subjects() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<(Subject & { deck_count: number })[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [color, setColor] = useState(colors[0]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("subjects").select("*, decks(count)").eq("user_id", user.id).order("created_at", { ascending: false });
    setSubjects((data ?? []).map((s: any) => ({ ...s, deck_count: s.decks?.[0]?.count ?? 0 })));
  };
  useEffect(() => { load(); }, [user]);

  const create = async () => {
    if (!name.trim() || !user) return;
    const { error } = await supabase.from("subjects").insert({ name: name.trim(), description: desc.trim() || null, color, user_id: user.id });
    if (error) return toast.error(error.message);
    toast.success("Matéria criada!");
    setName(""); setDesc(""); setOpen(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta matéria e todos os decks?")) return;
    await supabase.from("subjects").delete().eq("id", id);
    load();
  };

  return (
    <div className="container max-w-6xl py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold">Matérias</h1>
          <p className="text-muted-foreground mt-1">Organize seus estudos por área.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nova matéria</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova matéria</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Matemática" /></div>
              <div className="space-y-2"><Label>Descrição (opcional)</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} /></div>
              <div className="space-y-2"><Label>Cor</Label>
                <div className="flex gap-2">
                  {colors.map(c => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      className={`h-8 w-8 rounded-full transition-smooth ${color === c ? "ring-2 ring-offset-2 ring-foreground" : ""}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter><Button onClick={create}>Criar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {subjects.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">Nenhuma matéria ainda</h3>
          <p className="text-sm text-muted-foreground mb-4">Crie sua primeira matéria para começar.</p>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Criar matéria</Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(s => (
            <Card key={s.id} className="p-5 hover:shadow-soft transition-smooth group">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color + "20", color: s.color }}>
                  <BookOpen className="h-5 w-5" />
                </div>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => remove(s.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <h3 className="font-semibold">{s.name}</h3>
              {s.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.description}</p>}
              <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                <Layers className="h-3.5 w-3.5" /> {s.deck_count} {s.deck_count === 1 ? "deck" : "decks"}
              </div>
              <Link to={`/app/subjects/${s.id}`} className="block mt-4">
                <Button variant="outline" className="w-full">Abrir</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}