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
    // 📦 DATABASE BANDI
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
        name: "Horizon Europe",
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
    // 🔎 MATCH ENGINE
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
            score > 70 ? "high" : score > 40 ? "medium" : "low",
          reason: "Match basato su settore/stadio/regione"
        });
      }
    }

    matches.sort((a, b) => b.compatibility_score - a.compatibility_score);

    const top = matches.slice(0, 5);

    console.log("MATCH FOUND:", top.length);

    // =========================
    // 💰 STIMA FINANZIAMENTI
    // =========================

    let max = top.length > 0
      ? Math.max(...top.map(m => m.max_amount))
      : 30000;

    let multiplier =
      stage === "idea" ? 0.3 :
      stage === "mvp" ? 0.6 :
      1;

    // conversion safe
    const cap = Number(capital || 0);

    const conservative = Math.round(max * 0.1 * multiplier);
    const realistic = Math.round(max * 0.25 * multiplier);
    const optimistic = Math.round(max * 0.5 * multiplier);

    // =========================
    // 🚀 RESPONSE SICURA
    // =========================

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        business_summary: `Startup nel settore ${sector} con focus su AI e servizi.`,
        funding_opportunities: top,
        funding_estimate: {
          conservative,
          realistic,
          optimistic
        },
        overall_score: top.length ? top[0].compatibility_score : 10,
        next_action: top.length
          ? `Candidati a: ${top[0].name}`
          : "Migliora descrizione idea"
      })
    };

  } catch (err) {

    console.log("ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message
      })
    };
  }
};
