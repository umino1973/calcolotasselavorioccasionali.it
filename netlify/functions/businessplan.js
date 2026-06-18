const BANDI = require("./bandi");

function norm(s) {
  return (s || "").toString().toLowerCase().trim();
}

function evaluate(b, text, stage, region, capital) {

  let score = 0;

  const sectors = (b.sectors || []).map(norm);
  const stages = (b.stages || []).map(norm);
  const regions = (b.regions || []).map(norm);

  if (sectors.some(s => text.includes(s))) score += 40;
  if (stages.includes(stage)) score += 25;
  if (regions.includes(region)) score += 25;
  if (capital >= b.min_capital && capital <= b.max_capital) score += 10;

  return score;
}

function probability(score) {
  return Math.max(5, Math.min(95, Math.round(score * 0.9)));
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

    // SCORING UNICO
    const scored = BANDI.map(b => ({
      ...b,
      score: evaluate(b, text, stage, region, capital)
    })).sort((a, b) => b.score - a.score);

    const top3 = scored.slice(0, 3);
    const best = top3[0];

    const score = best?.score ?? 0;
    const prob = probability(score);

    return {

      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },

      body: JSON.stringify({

        score,
        probability: prob,

        best: best ? {
          name: best.name,
          entity: best.entity,
          score: best.score
        } : null,

        top3: top3.map(b => ({
          name: b.name,
          score: b.score
        })),

        message:
          score >= 70
            ? "Alta compatibilità con bandi disponibili"
            : score >= 40
              ? "Compatibilità media, ottimizzabile"
              : "Bassa compatibilità, serve riposizionamento"

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
