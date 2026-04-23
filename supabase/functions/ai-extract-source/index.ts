import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  // Try public transcript via timedtext (best-effort, may fail for some videos)
  try {
    const r = await fetch(`https://video.google.com/timedtext?lang=pt&v=${videoId}`);
    if (r.ok) {
      const xml = await r.text();
      if (xml && xml.length > 50) {
        return xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      }
    }
    const r2 = await fetch(`https://video.google.com/timedtext?lang=en&v=${videoId}`);
    if (r2.ok) {
      const xml = await r2.text();
      if (xml) return xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
  } catch (e) {
    console.error("transcript fetch failed", e);
  }
  return "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, url, text } = await req.json();

    if (type === "text") {
      return new Response(JSON.stringify({ content: String(text || "").slice(0, 50000) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "youtube") {
      const id = extractYouTubeId(url);
      if (!id) {
        return new Response(JSON.stringify({ error: "URL do YouTube inválida" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const transcript = await fetchYouTubeTranscript(id);
      // Get title via oEmbed
      let title = "";
      try {
        const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
        if (r.ok) {
          const j = await r.json();
          title = j.title || "";
        }
      } catch {}

      const content = transcript
        ? `Vídeo: ${title}\n\nTranscrição:\n${transcript}`
        : `Vídeo do YouTube: ${title || id}\n(Transcrição não disponível publicamente — gere conteúdo com base no título.)`;
      return new Response(JSON.stringify({ content, title }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "type inválido" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});