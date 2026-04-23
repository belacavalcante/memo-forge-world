import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, FileText, Youtube, Upload, Loader2, Layers, BookOpen, ListChecks } from "lucide-react";
import { toast } from "sonner";

type Mode = "flashcards" | "summary" | "quiz";

export default function Create() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("flashcards");
  const [text, setText] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [subjectId, setSubjectId] = useState<string>("none");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("subjects").select("id, name").eq("user_id", user.id).order("name").then(({ data }) => setSubjects(data ?? []));
  }, [user]);

  const readFileText = (f: File): Promise<string> => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("Erro ao ler arquivo"));
    r.readAsText(f);
  });

  const handleGenerate = async (sourceType: "text" | "youtube" | "file") => {
    if (!user) return;
    setLoading(true);
    try {
      let content = "";
      if (sourceType === "text") {
        content = text.trim();
        if (!content) { toast.error("Cole algum texto"); return; }
      } else if (sourceType === "youtube") {
        if (!youtubeUrl.trim()) { toast.error("Cole o link do YouTube"); return; }
        const { data, error } = await supabase.functions.invoke("ai-extract-source", {
          body: { type: "youtube", url: youtubeUrl.trim() },
        });
        if (error || data?.error) { toast.error(data?.error || "Erro ao buscar vídeo"); return; }
        content = data.content;
      } else if (sourceType === "file") {
        if (!file) { toast.error("Selecione um arquivo"); return; }
        if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
          content = await readFileText(file);
        } else {
          toast.error("Por enquanto, suba arquivos .txt ou .md. PDFs em breve.");
          return;
        }
      }

      const count = mode === "flashcards" ? 10 : mode === "quiz" ? 8 : 1;
      const { data: gen, error } = await supabase.functions.invoke("ai-generate", {
        body: { mode, content, count },
      });
      if (error || gen?.error) { toast.error(gen?.error || "Erro na IA"); return; }

      const subj = subjectId === "none" ? null : subjectId;

      if (mode === "flashcards") {
        const { data: deck, error: dErr } = await supabase.from("decks").insert({
          name: `Deck IA · ${new Date().toLocaleDateString("pt-BR")}`,
          subject_id: subj, user_id: user.id, source: sourceType === "youtube" ? "youtube" : "text",
          source_url: sourceType === "youtube" ? youtubeUrl : null,
        }).select().single();
        if (dErr) throw dErr;
        const cardsToInsert = (gen.cards as any[]).map(c => ({
          deck_id: deck.id, user_id: user.id, front: c.front, back: c.back,
        }));
        await supabase.from("flashcards").insert(cardsToInsert);
        toast.success(`${cardsToInsert.length} flashcards criados!`);
        nav(`/app/decks/${deck.id}`);
      } else if (mode === "summary") {
        const { data: sum, error: sErr } = await supabase.from("summaries").insert({
          user_id: user.id, subject_id: subj, title: gen.title || "Resumo", content: JSON.stringify(gen),
          source: sourceType === "youtube" ? "youtube" : "text",
        }).select().single();
        if (sErr) throw sErr;
        toast.success("Resumo gerado!");
        nav(`/app/summaries/${sum.id}`);
      } else if (mode === "quiz") {
        const { data: qz, error: qErr } = await supabase.from("quizzes").insert({
          user_id: user.id, subject_id: subj, title: `Quiz · ${new Date().toLocaleDateString("pt-BR")}`,
          questions: gen.questions,
        }).select().single();
        if (qErr) throw qErr;
        toast.success("Quiz criado!");
        nav(`/app/quizzes/${qz.id}`);
      }
    } catch (e: any) {
      toast.error(e.message || "Erro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" /> Criar com IA
        </h1>
        <p className="text-muted-foreground mt-1">Cole conteúdo e a IA gera material de estudo de qualidade.</p>
      </div>

      <Card className="p-6 mb-6">
        <Label className="mb-3 block">O que você quer gerar?</Label>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { v: "flashcards", icon: Layers, label: "Flashcards" },
            { v: "summary", icon: BookOpen, label: "Resumo + mapa mental" },
            { v: "quiz", icon: ListChecks, label: "Quiz" },
          ].map(o => (
            <button key={o.v} onClick={() => setMode(o.v as Mode)}
              className={`p-3 rounded-xl border-2 transition-smooth flex flex-col items-center gap-1 text-sm ${
                mode === o.v ? "border-primary bg-primary-soft text-primary font-medium" : "border-border hover:border-muted-foreground/30"
              }`}>
              <o.icon className="h-5 w-5" />
              {o.label}
            </button>
          ))}
        </div>

        {subjects.length > 0 && (
          <div className="space-y-2 mb-6">
            <Label>Salvar em (opcional)</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem matéria</SelectItem>
                {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        <Tabs defaultValue="text">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="text"><FileText className="h-4 w-4 mr-1" /> Texto</TabsTrigger>
            <TabsTrigger value="youtube"><Youtube className="h-4 w-4 mr-1" /> YouTube</TabsTrigger>
            <TabsTrigger value="file"><Upload className="h-4 w-4 mr-1" /> Arquivo</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-3 mt-4">
            <Textarea placeholder="Cole aqui o conteúdo: anotações, texto do livro, artigo..." rows={8} value={text} onChange={e => setText(e.target.value)} />
            <Button onClick={() => handleGenerate("text")} disabled={loading} className="w-full shadow-glow">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Gerar
            </Button>
          </TabsContent>

          <TabsContent value="youtube" className="space-y-3 mt-4">
            <Input placeholder="https://youtube.com/watch?v=..." value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} />
            <p className="text-xs text-muted-foreground">A IA vai extrair a transcrição do vídeo (quando disponível) e gerar o conteúdo.</p>
            <Button onClick={() => handleGenerate("youtube")} disabled={loading} className="w-full shadow-glow">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Gerar do vídeo
            </Button>
          </TabsContent>

          <TabsContent value="file" className="space-y-3 mt-4">
            <Input type="file" accept=".txt,.md" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            <p className="text-xs text-muted-foreground">Aceita .txt e .md por enquanto. Suporte a PDF em breve.</p>
            <Button onClick={() => handleGenerate("file")} disabled={loading || !file} className="w-full shadow-glow">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Gerar do arquivo
            </Button>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}