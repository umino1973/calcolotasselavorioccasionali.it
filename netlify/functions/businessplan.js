const BANDI = require("./bandi");

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

exports.handler = async (event) => {

  try {

    const body = JSON.parse(event.body || "{}");

    const idea = (body.idea || "").toLowerCase();
    const sector = (body.sector || "").toLowerCase();
    const stage = (body.stage || "").toLowerCase();
    const region = (body.region || "").toLowerCase();
    const capital = Number(body.capital || 0);

    const reportId = generateId();

    const text = `${idea} ${sector}`;

    const scored = BANDI.map(b => {

      let score = 0;

      if ((b.sectors || []).some(s => text.includes(s.toLowerCase())))
        score += 50;

      if ((b.stages || []).includes(stage))
        score += 20;

      if ((b.regions || []).includes(region))
        score += 15;

      if (capital >= b.min_capital && capital <= b.max_capital)
        score += 15;

      return {
        ...b,
        score
      };

    }).sort((a, b) => b.score - a.score);

    const top3 = scored.slice(0, 3);
    const best = top3[0];

    const probability = best ? Math.min(95, best.score) : 10;

    return {

      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },

      body: JSON.stringify({

        reportId,

        ai: {

          summary: best
            ? `Migliore opportunità: ${best.name}`
            : "Nessuna opportunità trovata",

          compatibility_score: best?.score || 0,

          probability_financing: probability,

          funding_range: best
            ? "€10.000 - €150.000 potenziale stimato"
            : "Non stimabile",

          breakdown_view: top3,

          next_steps: [
            "Verifica requisiti del bando principale",
            "Prepara business plan",
            "Contatta ente erogatore"
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
