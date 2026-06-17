const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
  console.log("V7 BUSINESSPLAN START");

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
    // 📦 LOAD DATABASE (SAFE)
    // =========================
    const dbPath = path.join(process.cwd(), "data", "bandi.json");

    let BANDI = [];

    try {
      BANDI = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    } catch (err) {
      console.log("DB ERROR:", err.message);

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Database bandi non caricato",
          detail: err.message
        })
      };
    }

    // =========================
    // 🧠 MATCHING ENGINE
    // =========================
    const text = `${idea} ${sector}`;

    const scored = BANDI.map(b => {
      let score = 0;

      // sectors
      if ((b.sectors || []).some(s => text.includes(s.toLowerCase())))
        score += 40;

      // stage
      if ((b.stages || []).includes(stage))
        score += 25;

      // region
      if ((b.regions || []).includes(region))
        score += 20;

      // capital
      if (capital >= b.min_capital && capital <= b.max_capital)
        score += 15;

      return {
        name: b.name,
        entity: b.entity,
        link: b.link,
        score,
        requirements: b.requirements || []
      };
    });

    const sorted = scored.sort((a, b) => b.score - a.score);

    const top = sorted.slice(0, 3);

    const eligible = top.filter(b => b.score >= 50);

    const partial = top.filter(b => b.score < 50 && b.score >= 20);

    const excluded = sorted.filter(b => b.score < 20);

    // =========================
    // 💰 SIMPLE ESTIMATE
    // =========================
    const best = top[0] || null;

    const base = best ? 10000 : 3000;

    const funding = {
      conservative: Math.round(base * 0.5),
      realistic: Math.round(base),
      optimistic: Math.round(base * 1.5)
    };

    // =========================
    // 📤 RESPONSE
    // =========================
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        business_summary: `Analisi V7 per ${sector || "idea"}`,

        eligible,
        partial,
        excluded,

        funding_estimate: funding,

        overall_score: best ? best.score : 10,

        next_action: best
          ? `Procedi con ${best.name}`
          : "Rivedere idea: nessun match forte",

        debug: {
          total_bandi: BANDI.length
        }
      })
    };

  } catch (err) {
    console.log("FATAL ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message
      })
    };
  }
};
