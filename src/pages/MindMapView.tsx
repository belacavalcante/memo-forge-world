import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import mermaid from "mermaid";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BrainCircuit, ChevronRight, Edit3, Eye, Maximize2, Save, Sparkles, ThumbsUp, Wand2 } from "lucide-react";
import { toast } from "sonner";

mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose" });

type MindBranch = { topic: string; children: string[] };

const nodeHues = ["344 64% 54%", "84 36% 56%", "198 78% 48%", "38 92% 55%", "276 60% 62%", "164 58% 42%"];

const cleanNodeText = (value: string) => value.replace(/^[\s\-•]+/, "").replace(/[(){}\[\]"]/g, "").trim();

const parseMindMap = (raw: string, fallbackTitle: string): { central: string; branches: MindBranch[] } => {
  const rows = raw.split("\n").map((line) => ({ indent: line.search(/\S|$/), text: cleanNodeText(line) })).filter((line) => line.text && !line.text.startsWith("mindmap"));
  if (!rows.length) return parseMindMap(createDopamineCode(fallbackTitle), fallbackTitle);
  const minIndent = Math.min(...rows.map((row) => row.indent));
  const rootIndex = rows.findIndex((line) => /^root\b/i.test(line.text) || line.indent <= minIndent);
  const central = cleanNodeText(rows[rootIndex]?.text.replace(/^root\s*/i, "") || fallbackTitle || "Mapa mental");
  const branchRows = rows.slice(rootIndex + 1);
  const firstLevelIndent = Math.min(...branchRows.map((row) => row.indent).filter((indent) => Number.isFinite(indent)));
  const branches: MindBranch[] = [];

  if (!Number.isFinite(firstLevelIndent)) return { central, branches: parseMindMap(createDopamineCode(central), central).branches };

  branchRows.forEach((row) => {
    if (row.indent <= firstLevelIndent || branches.length === 0) branches.push({ topic: row.text, children: [] });
    else branches[branches.length - 1].children.push(row.text);
  });

  return { central, branches: branches.slice(0, 8) };
};

const createDopamineCode = (title: string) => `mindmap
  root(${title || "Estudo ativo"})
    Entendimento profundo
      Conceitos essenciais
      Exemplos claros
      Conexões entre temas
    Memória ativa
      Flashcards SRS
      Revisão espaçada
      Recuperação sem consulta
    Performance
      Simulados
      Prova oral com IA
      Correção de lacunas`;

export default function MindMapView() {
  const { id } = useParams();
  const { user } = useAuth();
  const [map, setMap] = useState<any>(null);
  const [code, setCode] = useState("");
  const [svg, setSvg] = useState("");
  const [view, setView] = useState<"visual" | "mermaid">("visual");
  const [expanded, setExpanded] = useState<string | null>(null);
  const renderId = useRef(`mindy-map-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (!id) return;
    (supabase as any).from("mind_maps").select("*").eq("id", id).maybeSingle().then(({ data }: any) => {
      setMap(data);
      setCode(data?.mermaid_code ?? "");
    });
  }, [id]);

  useEffect(() => {
    if (!code.trim()) return;
    mermaid.render(renderId.current, code).then(({ svg }) => setSvg(svg)).catch(() => setSvg(""));
  }, [code]);

  const save = async () => {
    if (!map || !user || map.user_id !== user.id) return;
    const { error } = await (supabase as any).from("mind_maps").update({ mermaid_code: code }).eq("id", map.id);
    if (error) return toast.error(error.message);
    toast.success("Mapa mental atualizado");
  };

  const upvote = async () => {
    if (!map || !user) return;
    const { error } = await (supabase as any).from("material_upvotes").insert({
      user_id: user.id,
      material_type: "mind_map",
      material_id: map.id,
      creator_user_id: map.user_id,
    });
    if (error) return toast.error("Você já votou ou não pode votar neste material");
    toast.success("Upvote enviado");
  };

  if (!map) return <div className="container py-8">Carregando...</div>;
  const canEdit = user?.id === map.user_id;
  const visualMap = parseMindMap(code, map.title);

  return (
    <div className="container max-w-7xl py-8 animate-fade-in">
      <Link to="/app/mind-maps" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Mapas mentais
      </Link>
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div>
          <Badge variant="secondary" className="mb-3 gap-1"><Sparkles className="h-3.5 w-3.5" /> Mind map dopaminérgico</Badge>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{map.title}</h1>
          <p className="text-sm text-muted-foreground mt-2">Clique nos blocos para abrir os detalhes em abas rápidas · {map.upvotes_count ?? 0} upvotes</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={view === "visual" ? "default" : "outline"} onClick={() => setView("visual")}><Eye className="h-4 w-4" /> Visual</Button>
          <Button variant={view === "mermaid" ? "default" : "outline"} onClick={() => setView("mermaid")}><Edit3 className="h-4 w-4" /> Editar</Button>
          {canEdit && <Button variant="outline" onClick={() => setCode(createDopamineCode(map.title))}><Wand2 className="h-4 w-4" /> Melhorar</Button>}
          {map.visibility === "public" && <Button variant="outline" onClick={upvote}><ThumbsUp className="h-4 w-4 mr-1" /> Upvote</Button>}
          {canEdit && <Button onClick={save}><Save className="h-4 w-4 mr-1" /> Salvar</Button>}
        </div>
      </div>

      {view === "visual" ? (
        <Card className="mindy-map-shell border-border/70 overflow-hidden p-4 md:p-8 min-h-[620px]">
          <div className="grid xl:grid-cols-[340px_1fr] gap-5 h-full">
            <aside className="rounded-lg border bg-card/78 p-5 shadow-soft">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary-soft text-primary mb-5"><BrainCircuit className="h-6 w-6" /></div>
              <h2 className="text-2xl font-semibold leading-tight">{visualMap.central}</h2>
              <p className="text-sm text-muted-foreground mt-3">Mapa reorganizado para revisão ativa: ideia central, trilhas coloridas e abas de aprofundamento.</p>
              <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-secondary p-3"><strong className="block text-xl">{visualMap.branches.length}</strong><span className="text-xs text-muted-foreground">ramos</span></div>
                <div className="rounded-md bg-secondary p-3"><strong className="block text-xl">{visualMap.branches.reduce((acc, branch) => acc + branch.children.length, 0)}</strong><span className="text-xs text-muted-foreground">pontos</span></div>
                <div className="rounded-md bg-secondary p-3"><strong className="block text-xl">SRS</strong><span className="text-xs text-muted-foreground">ativo</span></div>
              </div>
            </aside>

            <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 content-start">
              {visualMap.branches.map((branch, index) => {
                const key = `${index}-${branch.topic}`;
                const isOpen = expanded === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : key)}
                    className="mindy-map-node text-left rounded-lg border p-4 transition-smooth hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    style={{ "--node-hue": nodeHues[index % nodeHues.length] } as CSSProperties}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="mindy-map-dot mt-1 h-3 w-3 rounded-full shrink-0" />
                      <Maximize2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold leading-snug">{branch.topic}</h3>
                    <p className="text-xs text-muted-foreground mt-2">{branch.children.length || 1} conexões de estudo</p>
                    {isOpen && (
                      <div className="mt-4 space-y-2 animate-fade-in">
                        {(branch.children.length ? branch.children : ["Transforme este ramo em flashcards e revisão ativa."]).map((child) => (
                          <div key={child} className="flex items-start gap-2 rounded-md bg-card/78 px-3 py-2 text-sm">
                            <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                            <span>{child}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </section>
          </div>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-[1fr_420px] gap-4">
          <Card className="p-4 overflow-auto min-h-[520px] flex items-center justify-center bg-card/80">
            {svg ? <div className="w-full [&_svg]:mx-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} /> : <p className="text-sm text-muted-foreground">Ajuste o código para renderizar o mapa.</p>}
          </Card>
          <Card className="p-4 bg-card/80">
            <Textarea value={code} onChange={(e) => setCode(e.target.value)} rows={22} disabled={!canEdit} className="font-mono text-sm" />
          </Card>
        </div>
      )}
    </div>
  );
}
