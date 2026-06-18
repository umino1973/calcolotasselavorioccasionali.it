const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

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

    const idea = body.idea || "";
    const sector = body.sector || "";
    const stage = body.stage || "";
    const region = body.region || "";
    const capital = Number(body.capital || 0);

    const text = `${idea} ${sector}`.toLowerCase();

    // =========================
    // 🧠 PRE-SCORING (STRUCTURE)
    // =========================

    const scored = BANDI.map(b => {

      let score = 0;

      if ((b.sectors || []).some(s => text.includes(s.toLowerCase())))
        score += 40;

      if ((b.stages || []).includes(stage.toLowerCase()))
        score += 20;

      if ((b.regions || []).includes(region.toLowerCase()))
        score += 20;

      if (capital >= b.min_capital && capital <= b.max_capital)
        score += 20;

      return {
        name: b.name,
        entity: b.entity,
        score,
        raw: b
      };
    }).sort((a, b) => b.score - a.score);

    const top3 = scored.slice(0, 3);

    const best = top3[0];

    // =========================
    // 🤖 AI ENGINE (V12 CORE)
    // =========================

    let aiAnalysis = null;

    try {

      const prompt = `
Sei un consulente esperto di finanza agevolata in Italia.

Devi analizzare questa startup:

IDEA: ${idea}
SETTORE: ${sector}
STADIO: ${stage}
REGIONE: ${region}
CAPITALE: ${capital}€

BANDI SELEZIONATI:
${top3.map(b => `- ${b.name} (score base: ${b.score})`).join("\n")}

OUTPUT JSON OBBLIGATORIO:

{
  "summary": "",
  "compatibility_score": 0,
  "probability_financing": 0,
  "analysis": [
    "spiegazione 1",
    "spiegazione 2"
  ],
  "strengths": [],
  "risks": [],
  "recommendations": [],
  "best_bands": [
    { "name": "", "reason": "", "score": 0 }
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
            { role: "system", content: "Sei un consulente senior di bandi e startup." },
            { role: "user", content: prompt }
          ],
          temperature: 0.4
        })
      });

      const data = await response.json();

      let content = data.choices?.[0]?.message?.content || "{}";

      content = content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      aiAnalysis = JSON.parse(content);

    } catch (err) {

      aiAnalysis = {
        summary: "AI non disponibile, fallback attivo",
        compatibility_score: best?.score || 0,
        probability_financing: 40,
        analysis: ["Fallback mode"],
        strengths: [],
        risks: ["AI error"],
        recommendations: ["Riprova più tardi"],
        best_bands: top3.map(b => ({
          name: b.name,
          reason: "matching base engine",
          score: b.score
        }))
      };
    }

    // =========================
    // 📤 RESPONSE V12
    // =========================

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },

      body: JSON.stringify({
        ai: aiAnalysis,
        engine: {
          top3: top3.map(b => ({
            name: b.name,
            score: b.score
          }))
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
