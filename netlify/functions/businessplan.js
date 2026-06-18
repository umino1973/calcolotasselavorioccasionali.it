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
    // 🧠 SCORING ENGINE V8
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
      if ((b.stages || []).includes(stage)) breakdown.stage = 20;
      if ((b.regions || []).includes(region)) breakdown.region = 15;

      if (
        capital >= b.min_capital &&
        capital <= b.max_capital
      ) {
        breakdown.capital = 15;
      }

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
    // 📊 PROBABILITÀ FINANZIAMENTO (V8)
    // =========================

    let probability = 10;

    if (best) {
      probability = Math.min(
        95,
        Math.round(
          (best.score * 0.9) +
          (capital > 10000 ? 10 : 0)
        )
      );
    }

    // =========================
    // 🧠 AI LAYER (CONSULENTE)
    // =========================

    let aiData = null;

    try {

      const prompt = `
Sei un consulente per bandi e startup in Italia.

Devi produrre un report operativo.

IDEA: ${idea}
SETTORE: ${sector}
REGIONE: ${region}
CAPITALE: ${capital}

TOP BANDI:
${top3.map(b => `
- ${b.name} (${b.score}/100)
`).join("\n")}

Rispondi in JSON:

{
  "summary": "...",
  "opportunity_strategy": "...",
  "risks": ["..."],
  "strengths": ["..."],
  "recommendation": "azione concreta per aumentare probabilità di finanziamento"
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
              content: "Sei un consulente esperto di finanziamenti pubblici e startup."
            },
            { role: "user", content: prompt }
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

      aiData = JSON.parse(content);

    } catch (err) {
      aiData = null;
    }

    // =========================
    // 🧾 RESPONSE V8
    // =========================

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },

      body: JSON.stringify({

        ai: {

          summary:
            aiData?.summary ||
            `Analisi completata. Miglior opportunità: ${best?.name || "Nessuna"}`,

          probability_financing: probability,

          compatibility_score: best?.score || 0,

          breakdown_view: top3,

          ai_insight: aiData || null,

          next_steps: [
            "Validare requisiti bando principale",
            "Preparare pitch",
            "Costruire MVP minimo",
            "Contattare ente erogatore"
          ]

        }

      })

    };

  } catch (err) {

    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
