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

    // =========================
    // 🧠 MOTORE BANDI
    // =========================

    const text = `${idea} ${sector}`;

    const results = BANDI.map(b => {

      let score = 0;
      let reasons = [];

      const sectorMatch =
        (b.sectors || []).some(s =>
          text.includes(s.toLowerCase())
        );

      if (sectorMatch) {
        score += 50;
        reasons.push("Settore compatibile");
      }

      if ((b.stages || []).includes(stage)) {
        score += 20;
        reasons.push("Fase progetto compatibile");
      }

      if ((b.regions || []).includes(region)) {
        score += 15;
        reasons.push("Area geografica compatibile");
      }

      if (
        capital >= b.min_capital &&
        capital <= b.max_capital
      ) {
        score += 15;
        reasons.push("Capitale compatibile");
      }

      return {
        ...b,
        score,
        reasons
      };

    });

    results.sort((a, b) => b.score - a.score);

    const top3 = results.slice(0, 3);
    const best = top3[0] || null;

    // =========================
    // 🧠 OPENAI ANALYSIS (SAFE)
    // =========================

    let aiAnalysis = null;
    let aiError = null;

    try {

      const prompt = `
Sei un consulente esperto di finanziamenti e startup.

Analizza questa idea:

IDEA: ${idea}
SETTORE: ${sector}
STADIO: ${stage}
REGIONE: ${region}
CAPITALE: ${capital}

BANDO PRINCIPALE:
${best ? best.name : "Nessuno"}

TOP 3 BANDI:
${top3.map(b => `- ${b.name} (${b.score}/100)`).join("\n")}

Rispondi in JSON:

{
  "summary": "analisi breve",
  "strengths": ["..."],
  "risks": ["..."],
  "recommendation": "strategia pratica per ottenere finanziamento"
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
            { role: "system", content: "Sei un consulente per startup e bandi pubblici italiani." },
            { role: "user", content: prompt }
          ],
          temperature: 0.4
        })
      });

      const data = await response.json();

      let content = data?.choices?.[0]?.message?.content || "";

      // pulizia markdown
      content = content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      aiAnalysis = JSON.parse(content);

    } catch (err) {
      aiError = err.message;
    }

    // =========================
    // 📊 COMPATIBILITY LABEL
    // =========================

    let label = "🔴 Bassa";

    if (best && best.score >= 80) label = "🟢 Alta";
    else if (best && best.score >= 60) label = "🟡 Media";

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

          summary:
            aiAnalysis?.summary ||
            `Analisi completata. Migliore bando: ${best ? best.name : "Nessuno"}`,

          compatibility_label: label,

          strengths:
            aiAnalysis?.strengths ||
            ["Motore bandi attivo", "Analisi compatibilità eseguita"],

          risks:
            aiAnalysis?.risks ||
            (best ? [] : ["Nessuna forte compatibilità rilevata"]),

          business_score:
            best ? best.score : 0,

          funding_suggestions:
            top3.map(b =>
              `${b.name} (${b.score}/100)\n${b.reasons.join(", ")}`
            ),

          ai_recommendation:
            aiAnalysis?.recommendation ||
            "Non disponibile",

          next_steps: [
            "Validare requisiti bando principale",
            "Preparare business plan",
            "Verificare documentazione richiesta",
            "Contattare ente erogatore"
          ]

        },

        debug: {
          total_bandi: BANDI.length,
          best_match: best?.name || null,
          openai_status: aiError ? "ERROR" : "OK",
          openai_error: aiError || null
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
