import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return json({ error: "LOVABLE_API_KEY not configured" }, 500);
    }

    const body = await req.json();
    const {
      fileName,
      rowCount,
      columns,
      numericColumns,
      categoricalColumns,
      stats,
      sampleRows,
    } = body;

    const systemPrompt = `You are a senior data analyst. Given a dataset summary, return a clear, concise analysis in plain English. Use short sections with markdown-style headings (no code fences). Cover:
1. Overview (1-2 sentences)
2. Key statistics & notable distributions
3. Trends or relationships you can infer
4. Highest / lowest values worth noting
5. Data-quality issues (missing values, outliers)
6. 2-3 actionable next-step suggestions
Keep total length under 350 words. Be specific with numbers from the data.`;

    const userPrompt = `Dataset: ${fileName ?? "untitled"}
Rows: ${rowCount}
Columns (${columns.length}): ${columns.join(", ")}
Numeric columns: ${numericColumns.join(", ") || "none"}
Categorical columns: ${categoricalColumns.join(", ") || "none"}

Per-column statistics:
${JSON.stringify(stats, null, 2)}

First sample rows:
${JSON.stringify(sampleRows, null, 2)}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return json({ error: "Rate limit reached, please wait a moment." }, 429);
      }
      if (aiResp.status === 402) {
        return json(
          { error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." },
          402,
        );
      }
      const txt = await aiResp.text();
      console.error("AI gateway error", aiResp.status, txt);
      return json({ error: "AI gateway error" }, 500);
    }

    const data = await aiResp.json();
    const insights: string =
      data?.choices?.[0]?.message?.content ?? "No insights returned.";

    return json({ insights });
  } catch (e) {
    console.error("ai-insights error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
