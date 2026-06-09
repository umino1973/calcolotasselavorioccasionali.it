exports.handler = async (event) => {
  try {

    console.log("FUNCTION STARTED");

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" })
      };
    }

    const body = JSON.parse(event.body || "{}");

    const { idea, sector, stage, region, capital } = body;

    // =========================
    // 📦 DATABASE BANDI (INLINE - NO IMPORT)
    // =========================

    const BANDI_DB = [
      {
        name: "Smart&Start Italia",
        entity: "Invitalia",
        link: "https://www.invitalia.it/cosa-facciamo/creiamo-nuove-aziende/smartstart-italia",
        sectors: ["ai", "tech", "digital", "servizi"],
        stage: "startup",
        region: "italy",
        max_amount: 1500000
      },
      {
        name: "Horizon Europe - EIC Accelerator",
        entity: "European Commission",
        link: "https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en",
        sectors: ["ai", "deeptech", "innovation"],
        stage: "startup",
        region: "eu",
        max_amount: 2500000
      },
      {
        name: "Fondo Lombardia Start",
        entity: "Regione Lombardia",
        link: "https://www.bandi.regione.lombardia.it",
        sectors: ["servizi", "innovazione"],
        stage: "idea",
        region: "lombardia",
        max_amount: 80000
      }
    ];

    const text = `${idea} ${sector}`.toLowerCase();

    // =========================
    // 🔎 MATCHING ENGINE
    // =========================

    let matches = [];

    for (const b of BANDI_DB) {

      let score = 0;

      if (b.sectors.some(s => text.includes(s))) score += 40;

      if (b.stage === stage) score += 30;

      if (b.region === region.toLowerCase() || b.region === "italy") score += 20;

      if (text.includes("ai") || text.includes("intelligenza")) score += 10;

      if (score > 20) {
        matches.push({
          ...b,
          compatibility_score: score,
          success_probability:
            score > 70 ? "high" : score > 40 ? "medium" : "low"
        });
      }
    }

    matches.sort((a, b) => b.compatibility_score - a.compatibility_score);

    const top = matches.slice(0, 5);

    console.log("MATCH FOUND:", top.length);

    // =========================
    // 💰 FUNDING ESTIMATE
    // =========================

    let max = top.length > 0
      ? Math.max(...top.map(m => m.max_amount))
      : 30000;

    let multiplier =
      stage === "idea" ? 0.3 :
      stage === "mvp" ? 0.6 :
      1;

    let conservative = Math.round(max * 0.1 * multiplier);
    let realistic = Math.round(max * 0.25 * multiplier);
    let optimistic = Math.round(max * 0.5 * multiplier);

    const fallback = {
      bootstrap: capital * 2,
      microcredit: capital * 3,
      bank_loans: capital * 5
    };

    // =========================
    // 🤖 AI SUMMARY
    // =========================

    let summary = "";

    try {
      const apiKey = process.env.OPENAI_API_KEY;

      const ai = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Sei un incubatore startup pragmatico."
            },
            {
              role: "user",
              content: `Riassumi questa idea in modo chiaro: ${idea}`
            }
          ]
        })
      });

      const data = await ai.json();
      summary = data?.choices?.[0]?.message?.content || "";

    } catch (e) {
      console.log("AI ERROR:", e.message);
      summary = "Analisi AI non disponibile";
    }

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
        business_summary: summary,
        funding_opportunities: top,
        funding_estimate: {
          conservative,
          realistic,
          optimistic
        },
        fallback_financing: fallback,
        overall_score: top.length ? top[0].compatibility_score : 10,
        next_action: top.length
          ? `Candidati a: ${top[0].name}`
          : "Migliora descrizione idea e riprova"
      })
    };

  } catch (err) {
    console.log("FUNCTION ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message
      })
    };
  }
};
