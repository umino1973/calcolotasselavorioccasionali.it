const BANDI = require("./bandi");

exports.handler = async (event) => {

  try {

    const body = JSON.parse(event.body || "{}");

    const user = body.user || "anon";

    const idea = (body.idea || "").toLowerCase();
    const sector = (body.sector || "").toLowerCase();
    const stage = (body.stage || "").toLowerCase();
    const region = (body.region || "").toLowerCase();
    const capital = Number(body.capital || 0);

    const text = `${idea} ${sector}`;

    const scored = BANDI.map(b => {

      let score = 0;

      const sectorMatch =
        (b.sectors || []).some(s =>
          text.includes(s.toLowerCase())
        );

      if (sectorMatch) score += 50;
      if ((b.stages || []).includes(stage)) score += 20;
      if ((b.regions || []).includes(region)) score += 15;

      if (capital >= b.min_capital && capital <= b.max_capital)
        score += 15;

      return {
        ...b,
        score
      };

    });

    scored.sort((a, b) => b.score - a.score);

    const top3 = scored.slice(0, 3);
    const best = top3[0] || null;

    return {

      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },

      body: JSON.stringify({

        user,

        ai: {

          summary:
            best
              ? `Migliore opportunità: ${best.name}`
              : "Nessuna opportunità",

          probability_financing: best ? Math.min(95, best.score) : 10,

          compatibility_score: best?.score || 0,

          breakdown_view: top3

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
