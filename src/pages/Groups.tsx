import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());

  const load = async () => {
    const { data } = await supabase.from("study_groups").select("*, group_members(count)").eq("is_public", true);
    setGroups(data ?? []);
    if (user) {
      const { data: m } = await supabase.from("group_members").select("group_id").eq("user_id", user.id);
      setMemberIds(new Set((m ?? []).map(x => x.group_id)));
    }
  };
  useEffect(() => { load(); }, [user]);

  const join = async (gid: string) => {
    if (!user) return;
    const { error } = await supabase.from("group_members").insert({ group_id: gid, user_id: user.id });
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo ao grupo!");
    load();
  };

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <h1 className="text-3xl font-semibold">Grupos de estudo</h1>
      <p className="text-muted-foreground mt-1 mb-8">Conecte-se com gente que estuda o mesmo que você.</p>
      <div className="grid md:grid-cols-2 gap-4">
        {groups.map(g => (
          <Card key={g.id} className="p-6 hover:shadow-soft transition-smooth">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: g.cover_color + "20", color: g.cover_color }}>
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg">{g.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">{g.description}</p>
            <p className="text-xs text-muted-foreground mb-3">{g.group_members?.[0]?.count ?? 0} membros</p>
            <div className="flex gap-2">
              {memberIds.has(g.id) ? (
                <Button asChild className="flex-1"><Link to={`/app/groups/${g.id}`}>Entrar <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
              ) : (
                <Button onClick={() => join(g.id)} className="flex-1">Participar</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}