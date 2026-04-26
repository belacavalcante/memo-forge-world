import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import mermaid from "mermaid";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ExternalLink, Maximize2, Save, Sparkles, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose" });

export default function MindMapView() {
  const { id } = useParams();
  const { user } = useAuth();
  const [map, setMap] = useState<any>(null);
  const [code, setCode] = useState("");
  const [svg, setSvg] = useState("");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const renderId = useRef(`mindy-map-${Math.random().toString(36).slice(2)}`);

  const nodes = useMemo(() => {
    const matches = [...code.matchAll(/^\s*([A-Za-z0-9_]+)\s*(?:\[|\(|\{)([^\]\)\}]+)(?:\]|\)|\})/gm)];
    return matches.map((match) => ({ id: match[1], label: match[2].replaceAll('"', "").trim() })).slice(0, 12);
  }, [code]);

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

  const openNode = (node = selectedNode) => {
    if (!node) return toast.info("Selecione um tópico primeiro");
    window.open(`/app/chat?topic=${encodeURIComponent(node)}`, "_blank", "noopener,noreferrer");
  };

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

  return (
    <div className="container max-w-6xl py-8 animate-fade-in">
      <Link to="/app/mind-maps" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Mapas mentais
      </Link>
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Mapa dopaminérgico
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{map.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">Clique em um tópico abaixo para aprofundar em uma nova aba · {map.upvotes_count ?? 0} upvotes</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" onClick={() => openNode()}><ExternalLink className="h-4 w-4 mr-1" /> Abrir tópico</Button>
          {map.visibility === "public" && <Button variant="outline" onClick={upvote}><ThumbsUp className="h-4 w-4 mr-1" /> Upvote</Button>}
          {canEdit && <Button onClick={save}><Save className="h-4 w-4 mr-1" /> Salvar</Button>}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-4">
        <Card className="overflow-hidden border-primary/10 shadow-glow">
          <div className="flex items-center justify-between gap-3 border-b bg-gradient-to-r from-primary-soft via-background to-accent-soft px-4 py-3">
            <div className="text-sm font-semibold">Visualização ativa</div>
            <Button variant="ghost" size="sm" onClick={() => window.open(window.location.href, "_blank", "noopener,noreferrer")}><Maximize2 className="h-4 w-4" /> Expandir</Button>
          </div>
          <div className="mindy-map-surface min-h-[520px] overflow-auto p-5 flex items-center justify-center bg-background">
            {svg ? <div className="w-full [&_svg]:mx-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} /> : <p className="text-sm text-muted-foreground">Ajuste o código para renderizar o mapa.</p>}
          </div>
        </Card>
        <Card className="p-4 space-y-4">
          <div>
            <h2 className="font-semibold mb-2">Tópicos clicáveis</h2>
            <div className="flex flex-wrap gap-2">
              {nodes.map((node) => (
                <button key={node.id} type="button" onClick={() => { setSelectedNode(node.label); openNode(node.label); }} className="rounded-full border border-primary/20 bg-primary-soft px-3 py-1.5 text-sm font-medium text-primary transition-smooth hover:scale-105 hover:shadow-soft">
                  {node.label}
                </button>
              ))}
              {nodes.length === 0 && <p className="text-sm text-muted-foreground">Os tópicos do mapa aparecerão aqui.</p>}
            </div>
          </div>
          <Textarea value={code} onChange={(e) => setCode(e.target.value)} rows={18} disabled={!canEdit} className="font-mono text-sm" />
        </Card>
      </div>
    </div>
  );
}
