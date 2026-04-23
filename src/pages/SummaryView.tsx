import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function SummaryView() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from("summaries").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (data) {
        try { setData({ ...data, parsed: JSON.parse(data.content) }); }
        catch { setData({ ...data, parsed: { summary: data.content, keyPoints: [], mindMap: null } }); }
      }
    });
  }, [id]);

  if (!data) return <div className="container py-8">Carregando...</div>;
  const p = data.parsed;

  return (
    <div className="container max-w-3xl py-8 animate-fade-in">
      <Link to="/app" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <h1 className="text-3xl font-semibold flex items-center gap-2 mb-6"><BookOpen className="h-7 w-7 text-primary" /> {p.title || data.title}</h1>

      {p.keyPoints?.length > 0 && (
        <Card className="p-5 mb-4 bg-primary-soft/30 border-primary/20">
          <h3 className="font-semibold mb-2">🎯 Pontos-chave</h3>
          <ul className="list-disc ml-5 space-y-1 text-sm">{p.keyPoints.map((k: string, i: number) => <li key={i}>{k}</li>)}</ul>
        </Card>
      )}

      <Card className="p-6 mb-4">
        <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{p.summary}</ReactMarkdown></div>
      </Card>

      {p.mindMap && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">🧠 Mapa mental</h3>
          <div className="text-center mb-4">
            <div className="inline-block px-4 py-2 gradient-primary text-primary-foreground rounded-xl font-semibold shadow-glow">{p.mindMap.central}</div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {p.mindMap.branches?.map((b: any, i: number) => (
              <Card key={i} className="p-4 bg-muted/30">
                <p className="font-medium text-primary mb-2">{b.topic}</p>
                <ul className="list-disc ml-4 text-sm space-y-1">{b.subtopics.map((s: string, j: number) => <li key={j}>{s}</li>)}</ul>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}