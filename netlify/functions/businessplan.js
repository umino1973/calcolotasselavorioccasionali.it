const BANDI = require("./bandi");

function norm(str) {
  return (str || "")
    .toString()
    .toLowerCase()
    .trim();
}

exports.handler = async (event) => {

  try {

    const body = JSON.parse(event.body || "{}");

    const idea = norm(body.idea);
    const sector = norm(body.sector);
    const stage = norm(body.stage);
    const region = norm(body.region);
    const capital = Number(body.capital || 0);

    const text = `${idea} ${sector}`;

    // =========================
    // 🧠 SAFE SCORING ENGINE
    // =========================

    const scored = BANDI.map(b => {

      let score = 0;

      const sectors = (b.sectors || []).map(norm);
      const stages = (b.stages || []).map(norm);
      const regions = (b.regions || []).map(norm);

      // SECTOR
      if (sectors.some(s => text.includes(s))) {
        score += 40;
      }

      // STAGE (SAFE)
      if (stages.includes(stage)) {
        score += 25;
      }

      // REGION (SAFE)
      if (regions.includes(region)) {
        score += 25;
      }

      // CAPITAL
      if (capital >= b.min_capital && capital <= b.max_capital) {
        score += 10;
      }

      // BOOST MINIMO (ANTI-ZERO)
      if (score === 0) score = 5;

      return {
        name: b.name,
        entity: b.entity,
        link: b.link,
        score
      };

    });

    scored.sort((a, b) => b.score - a.score);

    const top3 = scored.slice(0, 3);
    const best = top3[0];

    const probability =
      best?.score >= 80 ? 90 :
      best?.score >= 60 ? 70 :
      best?.score >= 40 ? 50 :
      25;

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
            : "Nessuna opportunità rilevante trovata",

          compatibility_score: best?.score || 0,

          probability_financing: probability,

          breakdown_view: top3,

          funding_range: "€10.000 - €150.000 stimati",

          next_steps: best
            ? [
                `Verifica requisiti: ${best.name}`,
                "Prepara business plan",
                "Analizza documentazione bando"
              ]
            : [
                "Rivedere input (settore/regione)",
                "Ampliare idea o mercato",
                "Controllare coerenza dati inseriti"
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
