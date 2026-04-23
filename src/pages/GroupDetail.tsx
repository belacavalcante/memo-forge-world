import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Users, Trophy } from "lucide-react";
import { toast } from "sonner";

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, any>>({});
  const [content, setContent] = useState("");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const load = async () => {
    if (!id) return;
    const [{ data: g }, { data: p }] = await Promise.all([
      supabase.from("study_groups").select("*").eq("id", id).maybeSingle(),
      supabase.from("group_posts").select("*").eq("group_id", id).order("created_at", { ascending: false }).limit(50),
    ]);
    setGroup(g);
    setPosts(p ?? []);
    const userIds = Array.from(new Set([...(p ?? []).map((x: any) => x.user_id)]));
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name, avatar_url, xp").in("user_id", userIds);
      const map: Record<string, any> = {};
      (profs ?? []).forEach((pr: any) => { map[pr.user_id] = pr; });
      setProfilesById(map);
    }
    // Leaderboard: top members do grupo por XP
    const { data: members } = await supabase.from("group_members").select("user_id").eq("group_id", id);
    if (members && members.length) {
      const { data: top } = await supabase.from("profiles")
        .select("user_id, display_name, xp, current_streak")
        .in("user_id", members.map((m: any) => m.user_id))
        .order("xp", { ascending: false }).limit(10);
      setLeaderboard(top ?? []);
    }
  };
  useEffect(() => { load(); }, [id]);

  const post = async () => {
    if (!content.trim() || !user || !id) return;
    const { error } = await supabase.from("group_posts").insert({ group_id: id, user_id: user.id, content: content.trim() });
    if (error) return toast.error(error.message);
    setContent(""); load();
  };

  if (!group) return <div className="container py-8">Carregando...</div>;

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <Link to="/app/groups" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Grupos
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: group.cover_color + "20", color: group.cover_color }}>
          <Users className="h-6 w-6" />
        </div>
        <div><h1 className="text-2xl font-semibold">{group.name}</h1>
        <p className="text-sm text-muted-foreground">{group.description}</p></div>
      </div>

      <div className="grid lg:grid-cols-[1fr,280px] gap-6">
        <div className="space-y-4">
          <Card className="p-4">
            <Textarea placeholder="Compartilhe algo com a galera..." value={content} onChange={e => setContent(e.target.value)} rows={3} />
            <div className="flex justify-end mt-2"><Button onClick={post} disabled={!content.trim()}>Publicar</Button></div>
          </Card>
          {posts.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Seja o primeiro a postar!</p>}
          {posts.map(p => {
            const prof = profilesById[p.user_id];
            return (
              <Card key={p.id} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-primary-soft text-primary flex items-center justify-center text-sm font-semibold">
                    {(prof?.display_name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{prof?.display_name || "Estudante"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{p.content}</p>
              </Card>
            );
          })}
        </div>
        <div>
          <Card className="p-4 sticky top-20">
            <h3 className="font-semibold flex items-center gap-2 mb-3"><Trophy className="h-4 w-4 text-warning" /> Top da galera</h3>
            {leaderboard.length === 0 && <p className="text-xs text-muted-foreground">Sem ranking ainda.</p>}
            <div className="space-y-2">
              {leaderboard.map((m, i) => (
                <div key={m.user_id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    {m.display_name || "Estudante"}
                  </span>
                  <span className="font-semibold text-primary text-xs">{m.xp} XP</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}