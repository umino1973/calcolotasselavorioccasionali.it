exports.handler = async (event) => {

  console.log("BUSINESSPLAN V1 START");

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
    const stage = body.stage || "idea";
    const region = (body.region || "").toLowerCase();
    const capital = Number(body.capital || 0);

    const text = `${idea} ${sector}`;

    // =========================
    // 📦 BANDI STATICI (STABILI)
    // =========================

    const BANDI = [
      {
        name: "Smart&Start Italia",
        entity: "Invitalia",
        regions: ["italy"],
        signals: ["startup", "innovazione", "ai", "tech", "digital"],
        stages: ["idea", "mvp", "startup"],
        min_capital: 0,
        max_capital: 1500000
      },
      {
        name: "Fondo Lombardia Start",
        entity: "Regione Lombardia",
        regions: ["lombardia"],
        signals: ["servizi", "badanti", "pmi", "innovazione"],
        stages: ["idea", "mvp"],
        min_capital: 5000,
        max_capital: 100000
      },
      {
        name: "Horizon Europe",
        entity: "EU Commission",
        regions: ["eu", "italy", "lombardia"],
        signals: ["ai", "deeptech", "ricerca"],
        stages: ["startup"],
        min_capital: 0,
        max_capital: 99999999
      }
    ];

    // =========================
    // 🧠 SCORING ENGINE
    // =========================

    function scoreBando(b) {

      let score = 0;

      if (b.regions.includes(region)) score += 30;

      if (b.stages.includes(stage)) score += 20;

      if (capital >= b.min_capital && capital <= b.max_capital) score += 20;

      const matches = b.signals.filter(s => text.includes(s));
      score += Math.min(50, matches.length * 15);

      return Math.min(100, score);
    }

    const results = BANDI.map(b => {

      const score = scoreBando(b);

      return {
        name: b.name,
        entity: b.entity,
        score,
        status:
          score > 70 ? "HIGH_MATCH" :
          score > 40 ? "MEDIUM_MATCH" :
          "LOW_MATCH"
      };
    });

    const sorted = results.sort((a, b) => b.score - a.score);
    const best = sorted[0];

    // =========================
    // 🚀 OUTPUT FREE (SIMPLE + STABILE)
    // =========================

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({

        summary: {
          interpretation:
            best.score > 70
              ? "Idea con buona probabilità di finanziamento"
              : "Idea da migliorare o riposizionare"
        },

        best_match: best,

        alternatives: sorted,

        next_step:
          best.score > 70
            ? "Prepara candidatura su bando principale"
            : "Rafforza idea o cambia settore"

      })
    };

  } catch (err) {

    console.log("ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message || "Server error"
      })
    };
  }
};
