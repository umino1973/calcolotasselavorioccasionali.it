const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const BANDI = require("./bandi");

function safeJsonParse(text) {
  try {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
}

exports.handler = async (event) => {

  try {

    const body = JSON.parse(event.body || "{}");

    const idea = body.idea || "";
    const sector = body.sector || "";
    const stage = body.stage || "";
    const region = body.region || "";
    const capital = Number(body.capital || 0);

    const text = `${idea} ${sector}`.toLowerCase();

    // =========================
    // ENGINE BASE (STABILE)
    // =========================

    const top3 = BANDI.map(b => {

      let score = 0;

      if ((b.sectors || []).some(s => text.includes(s.toLowerCase())))
        score += 40;

      if ((b.stages || []).includes(stage.toLowerCase()))
        score += 25;

      if ((b.regions || []).includes(region.toLowerCase()))
        score += 20;

      if (capital >= b.min_capital && capital <= b.max_capital)
        score += 15;

      return {
        name: b.name,
        entity: b.entity,
        score,
        raw: b
      };

    }).sort((a, b) => b.score - a.score).slice(0, 3);

    const best = top3[0];

    // =========================
    // 🤖 OPENAI (ROBUST)
    // =========================

    let aiResult = null;
    let rawResponse = "";

    try {

      const prompt = `
Sei un consulente italiano di bandi.

Analizza:

IDEA: ${idea}
SETTORE: ${sector}
STADIO: ${stage}
REGIONE: ${region}
CAPITALE: ${capital}€

BANDI:
${top3.map(b => `- ${b.name} (${b.score})`).join("\n")}

Rispondi SOLO JSON valido, senza testo extra:

{
  "summary": "string",
  "probability_financing": number,
  "analysis": ["string"],
  "strengths": ["string"],
  "risks": ["string"],
  "recommendations": ["string"]
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
            { role: "system", content: "Rispondi SOLO in JSON valido." },
            { role: "user", content: prompt }
          ],
          temperature: 0.2
        })
      });

      const data = await response.json();

      rawResponse = data?.choices?.[0]?.message?.content || "";

      aiResult = safeJsonParse(rawResponse);

    } catch (err) {
      aiResult = null;
    }

    // =========================
    // FALLBACK INTELLIGENTE (IMPORTANTE)
    // =========================

    if (!aiResult) {
      aiResult = {
        summary: "Analisi basata su motore interno (AI non disponibile)",
        probability_financing: best ? Math.min(90, best.score) : 30,
        analysis: ["Matching basato su regole"],
        strengths: [],
        risks: [],
        recommendations: ["Riprova analisi AI più tardi"]
      };
    }

    // =========================
    // RESPONSE
    // =========================

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },

      body: JSON.stringify({
        ai: aiResult,
        engine: {
          top3
        },
        debug: {
          rawOpenAI: rawResponse
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
