const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
  console.log("V4 BUSINESSPLAN START");

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
    const dbPath = path.join(
  process.cwd(),
  "data",
  "bandi.json"
);

const BANDI = JSON.parse(
  fs.readFileSync(dbPath, "utf8")
);

const text = (
  idea +
  " " +
  sector
).toLowerCase();

const matchedBandi = BANDI.map(b => {

  let score = 0;

  const sectorMatch =
    (b.sectors || []).some(s =>
      text.includes(s.toLowerCase())
    );

  if (sectorMatch) score += 40;

  if ((b.stages || []).includes(stage.toLowerCase()))
    score += 30;

  if ((b.regions || []).includes(region.toLowerCase()))
    score += 20;

  if (
    capital >= b.min_capital &&
    capital <= b.max_capital
  )
    score += 10;

  return {
    ...b,
    score
  };

})
.sort((a,b) => b.score - a.score)
.slice(0,3);

    const prompt = `
Sei un consulente esperto di startup e finanziamenti pubblici in Italia.

Analizza questa idea imprenditoriale:

IDEA: ${idea}
SETTORE: ${sector}
STADIO: ${stage}
REGIONE: ${region}
CAPITALE: ${capital}€

Rispondi in JSON con questo formato:

{
  "summary": "analisi breve del progetto",
  "strengths": ["..."],
  "risks": ["..."],
  "business_score": 0-100,
  "funding_suggestions": ["...3-5 bandi o strumenti finanziari plausibili..."],
  "next_steps": ["...azioni concrete..."]
}

Non inventare numeri precisi, sii realistico.
`;

    // =========================
    // 🤖 OPENAI CALL
    // =========================

    let aiResult = null;
    let aiError = null;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Sei un consulente startup esperto." },
            { role: "user", content: prompt }
          ],
          temperature: 0.4
        })
      });

      const data = await response.json();

      if (!data.choices || !data.choices[0]) {
        throw new Error("Invalid OpenAI response");
      }

     let content = data.choices[0].message.content;

// 🔥 PULIZIA MARKDOWN ```json ... ```
content = content
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

aiResult = JSON.parse(content);

    } catch (err) {
      console.log("OPENAI ERROR:", err.message);
      aiError = err.message;
    }

    // =========================
    // 📦 FALLBACK INTELLIGENTE
    // =========================

    if (!aiResult) {
      aiResult = {
        summary: "Analisi fallback: AI non disponibile, uso logica base.",
        strengths: ["idea imprenditoriale presente"],
        risks: ["AI analysis non attiva"],
        business_score: 40,
        funding_suggestions: [
          "Smart&Start Italia",
          "Fondo Innovazione PMI",
          "Bandi regionali Lombardia"
        ],
        next_steps: ["Attivare API OpenAI", "Raffinare business model"]
      };
    }

    // =========================
    // 📊 RESPONSE
    // =========================

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        input: {
          idea,
          sector,
          stage,
          region,
          capital
        },
        ai: aiResult,
        debug: {
          openai_status: aiError ? "ERROR" : "OK",
          error: aiError
        }
      })
    };

  } catch (err) {
    console.log("FATAL ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message || "Unknown error"
      })
    };
  }
};
