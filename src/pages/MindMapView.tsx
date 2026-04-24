import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import mermaid from "mermaid";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose" });

export default function MindMapView() {
  const { id } = useParams();
  const { user } = useAuth();
  const [map, setMap] = useState<any>(null);
  const [code, setCode] = useState("");
  const [svg, setSvg] = useState("");
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

  return (
    <div className="container max-w-6xl py-8 animate-fade-in">
      <Link to="/app/mind-maps" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Mapas mentais
      </Link>
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">{map.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{map.visibility === "public" ? "Público" : "Privado"} · {map.upvotes_count ?? 0} upvotes</p>
        </div>
        <div className="flex gap-2">
          {map.visibility === "public" && <Button variant="outline" onClick={upvote}><ThumbsUp className="h-4 w-4 mr-1" /> Upvote</Button>}
          {canEdit && <Button onClick={save}><Save className="h-4 w-4 mr-1" /> Salvar</Button>}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_420px] gap-4">
        <Card className="p-4 overflow-auto min-h-[420px] flex items-center justify-center">
          {svg ? <div className="w-full [&_svg]:mx-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} /> : <p className="text-sm text-muted-foreground">Ajuste o código para renderizar o mapa.</p>}
        </Card>
        <Card className="p-4">
          <Textarea value={code} onChange={(e) => setCode(e.target.value)} rows={18} disabled={!canEdit} className="font-mono text-sm" />
        </Card>
      </div>
    </div>
  );
}
