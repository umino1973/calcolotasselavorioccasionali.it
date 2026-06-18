const BANDI = require("./bandi");

exports.handler = async (event) => {

  try {

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" })
      };
    }

    const body = JSON.parse(event.body || "{}");

    const idea = (body.idea || "").toLowerCase();
    const sector = (body.sector || "").toLowerCase();
    const stage = (body.stage || "").toLowerCase();
    const region = (body.region || "").toLowerCase();
    const capital = Number(body.capital || 0);

    const text = `${idea} ${sector}`;

    // =========================
    // 🧠 SCORING ENGINE (V7)
    // =========================

    const scored = BANDI.map(b => {

      let breakdown = {
        sector: 0,
        stage: 0,
        region: 0,
        capital: 0
      };

      const sectorMatch =
        (b.sectors || []).some(s =>
          text.includes(s.toLowerCase())
        );

      if (sectorMatch) breakdown.sector = 50;

      if ((b.stages || []).includes(stage))
        breakdown.stage = 20;

      if ((b.regions || []).includes(region))
        breakdown.region = 15;

      if (
        capital >= b.min_capital &&
        capital <= b.max_capital
      )
        breakdown.capital = 15;

      const score =
        breakdown.sector +
        breakdown.stage +
        breakdown.region +
        breakdown.capital;

      return {
        name: b.name,
        entity: b.entity,
        link: b.link,
        requirements: b.requirements || [],
        breakdown,
        score
      };

    });

    scored.sort((a, b) => b.score - a.score);

    const top3 = scored.slice(0, 3);
    const best = top3[0] || null;

    // =========================
    // 🧠 OPENAI (per ogni bando)
    // =========================

    let aiResults = [];

    try {

      const prompt = `
Sei un consulente esperto di finanziamenti pubblici.

Analizza OGNI bando e spiega in modo pratico perché è compatibile o no.

IDEA:
${idea}

TOP BANDI:
${top3.map(b => `
- ${b.name}
Score: ${b.score}
Breakdown: ${JSON.stringify(b.breakdown)}
`).join("\n")}

Rispondi in JSON:

{
  "analysis": [
    {
      "name": "...",
      "verdict": "alta/media/bassa compatibilità",
      "why": ["..."],
      "how_to_improve": ["..."]
    }
  ]
}
`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Sei un consulente esperto di bandi e startup in Italia."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.4
        })
      });

      const data = await response.json();

      let content = data?.choices?.[0]?.message?.content || "";

      content = content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      aiResults = JSON.parse(content).analysis || [];

    } catch (err) {
      aiResults = [];
    }

    // =========================
    // 📊 LABEL
    // =========================

    let label = "🔴 Bassa";

    if (best?.score >= 80) label = "🟢 Alta";
    else if (best?.score >= 60) label = "🟡 Media";

    // =========================
    // 🚀 RESPONSE
    // =========================

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },

      body: JSON.stringify({

        ai: {

          summary: best
            ? `Migliore opportunità: ${best.name}`
            : "Nessun bando rilevante",

          compatibility_label: label,

          breakdown_view: top3.map(b => ({
            name: b.name,
            score: b.score,
            breakdown: b.breakdown
          })),

          ai_explanation: aiResults,

          next_steps: [
            "Preparare business plan dettagliato",
            "Validare requisiti del bando migliore",
            "Definire MVP del progetto"
          ]

        }

      })

    };

  } catch (err) {

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message
      })
    };
  }
};
