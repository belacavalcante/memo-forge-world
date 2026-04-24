import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Lock, Globe2, Star } from "lucide-react";

export default function MindMaps() {
  const [maps, setMaps] = useState<any[]>([]);

  useEffect(() => {
    (supabase as any)
      .from("mind_maps")
      .select("*")
      .order("updated_at", { ascending: false })
      .then(({ data }: any) => setMaps(data ?? []));
  }, []);

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <h1 className="text-3xl font-semibold flex items-center gap-2"><BrainCircuit className="h-7 w-7 text-primary" /> Mapas mentais</h1>
      <p className="text-muted-foreground mt-1 mb-8">Mapas gerados por IA em Mermaid, editáveis e prontos para revisão visual.</p>

      {maps.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <BrainCircuit className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">Nenhum mapa mental ainda</h3>
          <p className="text-sm text-muted-foreground">Gere um resumo com IA para criar seu primeiro mapa automaticamente.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {maps.map((map) => (
            <Link key={map.id} to={`/app/mind-maps/${map.id}`}>
              <Card className="p-5 hover:shadow-soft transition-smooth h-full">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="bg-primary-soft text-primary inline-flex p-2.5 rounded-xl"><BrainCircuit className="h-5 w-5" /></div>
                  <div className="flex items-center gap-2">
                    {map.elite_badge && <Badge variant="secondary"><Star className="h-3 w-3 mr-1" /> Elite</Badge>}
                    <Badge variant="outline">{map.visibility === "public" ? <Globe2 className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}{map.visibility === "public" ? "Público" : "Privado"}</Badge>
                  </div>
                </div>
                <h3 className="font-semibold text-lg">{map.title}</h3>
                {map.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{map.description}</p>}
                <p className="text-xs text-muted-foreground mt-4">{map.upvotes_count ?? 0} upvotes</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
