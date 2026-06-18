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
    // 🧠 V11 SCORING ENGINE
    // =========================

    const scored = BANDI.map(b => {

      let score = 0;
      let reasons = [];

      // 1. SECTOR MATCH (peso alto)
      const sectorMatch = (b.sectors || []).some(s =>
        text.includes(s.toLowerCase())
      );

      if (sectorMatch) {
        score += 45;
        reasons.push("Settore compatibile");
      } else {
        score -= 10;
      }

      // 2. STAGE MATCH
      const stageMatch = (b.stages || []).includes(stage);

      if (stageMatch) {
        score += 25;
        reasons.push("Fase progetto compatibile");
      } else {
        score -= 5;
      }

      // 3. REGION MATCH
      const regionMatch = (b.regions || []).includes(region);

      if (regionMatch) {
        score += 20;
        reasons.push("Area geografica compatibile");
      } else {
        score -= 8;
      }

      // 4. CAPITAL FIT (più realistico)
      const capitalFit =
        capital >= b.min_capital &&
        capital <= b.max_capital;

      if (capitalFit) {
        score += 20;
        reasons.push("Budget compatibile");
      } else {
        score -= 15;
      }

      // 5. BONUS STARTUP INNOVATIVA
      if (sector.includes("ai") || sector.includes("tech")) {
        if (b.sectors.includes("ai")) {
          score += 10;
          reasons.push("Bonus innovazione tecnologica");
        }
      }

      // clamp
      score = Math.max(0, Math.min(100, score));

      return {
        name: b.name,
        entity: b.entity,
        link: b.link,
        score,
        reasons
      };
    });

    // =========================
    // 📊 SORT
    // =========================

    scored.sort((a, b) => b.score - a.score);

    const top3 = scored.slice(0, 3);
    const best = top3[0];

    // =========================
    // 🧠 GLOBAL SCORE (REALISTIC)
    // =========================

    const globalScore = best ? best.score : 0;

    const probability =
      globalScore >= 80 ? 90 :
      globalScore >= 60 ? 70 :
      globalScore >= 40 ? 45 :
      20;

    // =========================
    // 📊 RESPONSE V11
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
            : "Nessun bando altamente compatibile trovato",

          compatibility_score: globalScore,

          probability_financing: probability,

          breakdown_view: top3.map(b => ({
            name: b.name,
            score: b.score,
            reasons: b.reasons
          })),

          funding_range: best
            ? "€10.000 - €200.000 stimati"
            : "Non determinabile",

          next_steps: best
            ? [
                `Verifica requisiti: ${best.name}`,
                "Prepara business plan dettagliato",
                "Raccogli documentazione aziendale"
              ]
            : [
                "Rivedere settore o idea",
                "Aumentare coerenza progetto-bandi",
                "Analizzare bandi regionali alternativi"
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
