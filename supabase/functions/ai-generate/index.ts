import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const { mode, content, count = 8, language = "pt-BR" } = await req.json();
    if (!mode || !content) {
      return new Response(JSON.stringify({ error: "mode e content são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let tool: any;
    let system = `Você é um tutor brilhante. Responda sempre em ${language}. Seja didático, claro e direto.`;

    const toMermaid = ` Use sintaxe Mermaid mindmap válida quando solicitado, com um nó central e ramificações curtas. Não use aspas problemáticas nem markdown em volta do código.`;

    if (mode === "flashcards") {
      tool = {
        type: "function",
        function: {
          name: "create_flashcards",
          description: "Cria flashcards de estudo",
          parameters: {
            type: "object",
            properties: {
              cards: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    front: { type: "string", description: "Pergunta curta" },
                    back: { type: "string", description: "Resposta clara e completa" },
                  },
                  required: ["front", "back"],
                  additionalProperties: false,
                },
              },
            },
            required: ["cards"],
            additionalProperties: false,
          },
        },
      };
      system += ` Gere ${count} flashcards de alta qualidade com base no conteúdo. As perguntas devem testar compreensão real, não decoreba óbvia.`;
    } else if (mode === "quiz") {
      tool = {
        type: "function",
        function: {
          name: "create_quiz",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    options: { type: "array", items: { type: "string" } },
                    correctIndex: { type: "integer" },
                    explanation: { type: "string" },
                  },
                  required: ["question", "options", "correctIndex", "explanation"],
                  additionalProperties: false,
                },
              },
            },
            required: ["questions"],
            additionalProperties: false,
          },
        },
      };
      system += ` Crie ${count} questões de múltipla escolha (4 alternativas cada). Inclua explicação curta da resposta correta.`;
    } else if (mode === "summary") {
      tool = {
        type: "function",
        function: {
          name: "create_summary",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string" },
              summary: { type: "string", description: "Resumo em markdown com seções, bullets e destaques" },
              keyPoints: { type: "array", items: { type: "string" } },
              mindMap: {
                type: "object",
                description: "Mapa mental hierárquico",
                properties: {
                  central: { type: "string" },
                  branches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        topic: { type: "string" },
                        subtopics: { type: "array", items: { type: "string" } },
                      },
                      required: ["topic", "subtopics"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["central", "branches"],
                additionalProperties: false,
              },
              mermaidCode: { type: "string", description: "Código Mermaid mindmap editável" },
            },
            required: ["title", "summary", "keyPoints", "mindMap", "mermaidCode"],
            additionalProperties: false,
          },
        },
      };
      system += ` Crie um resumo completo, estruturado e lúdico em markdown, com pontos-chave e um mapa mental hierárquico.${toMermaid}`;
    } else if (mode === "study_plan") {
      tool = {
        type: "function",
        function: {
          name: "create_study_plan",
          parameters: {
            type: "object",
            properties: {
              weeks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    week: { type: "integer" },
                    focus: { type: "string" },
                    days: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          day: { type: "string" },
                          tasks: { type: "array", items: { type: "string" } },
                        },
                        required: ["day", "tasks"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["week", "focus", "days"],
                  additionalProperties: false,
                },
              },
            },
            required: ["weeks"],
            additionalProperties: false,
          },
        },
      };
      system += ` Crie um plano de estudos personalizado, semanal, prático e motivador.`;
    } else {
      return new Response(JSON.stringify({ error: "mode inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: String(content).slice(0, 50000) },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: tool.function.name } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de uso da IA atingido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos da IA esgotados. Adicione créditos na sua workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error", response.status, t);
      return new Response(JSON.stringify({ error: "Erro na IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : {};

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});