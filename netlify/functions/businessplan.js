
const BANDI = require("./bandi");

function norm(s) {
  return (s || "").toString().toLowerCase().trim();
}

// =========================
// 🧠 SCORE ENGINE + EXPLANATION
// =========================

function calculateScore(b, text, stage, region, capital) {

  let score = 0;
  let explanation = [];

  const sectors = (b.sectors || []).map(norm);
  const stages = (b.stages || []).map(norm);
  const regions = (b.regions || []).map(norm);

  // SECTOR MATCH
  const sectorMatch = sectors.find(s => text.includes(s));
  if (sectorMatch) {
    score += 40;
    explanation.push(`+40: settore compatibile (${sectorMatch})`);
  } else {
    explanation.push(`0: nessuna corrispondenza settoriale`);
  }

  // STAGE MATCH
  if (stages.includes(stage)) {
    score += 25;
    explanation.push(`+25: fase progetto compatibile (${stage})`);
  } else {
    explanation.push(`0: fase progetto non allineata`);
  }

  // REGION MATCH
  if (regions.includes(region)) {
    score += 25;
    explanation.push(`+25: regione compatibile (${region})`);
  } else {
    explanation.push(`0: regione non supportata dal bando`);
  }

  // CAPITAL MATCH
  if (capital >= b.min_capital && capital <= b.max_capital) {
    score += 10;
    explanation.push(`+10: capitale nel range richiesto`);
  } else {
    explanation.push(`0: capitale fuori range`);
  }

  return { score, explanation };
}

// =========================
// 🧠 HANDLER
// =========================

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
    // 🧠 SCORING
    // =========================

    const scored = BANDI.map(b => {

      const { score, explanation } = calculateScore(
        b,
        text,
        stage,
        region,
        capital
      );

      return {
        name: b.name,
        entity: b.entity,
        score,
        explanation
      };

    }).sort((a, b) => b.score - a.score);

    const top3 = scored.slice(0, 3);
    const best = top3[0];

    const score = best?.score || 0;

    // probabilità coerente
    const probability = Math.round(score * 0.9);

    // =========================
    // 🧠 NARRAZIONE SPIEGABILE
    // =========================

    const narrative = best
      ? `
Analisi completata sul tuo progetto.

Il bando più compatibile è: ${best.name}

📊 RISULTATO:
- Score compatibilità: ${score}/100
- Probabilità stimata: ${probability}%

🧠 SPIEGAZIONE DETTAGLIATA DEL PUNTEGGIO:

${best.explanation.map(e => `- ${e}`).join("\n")}

👉 Interpretazione:
Ogni punto assegnato deriva da una corrispondenza reale tra il tuo progetto e i requisiti del bando.
Non si tratta di stime arbitrarie, ma di matching diretto su 4 fattori:
settore, fase, regione e capitale.

👉 Conclusione:
Il progetto è ${score >= 70 ? "fortemente compatibile" : "parzialmente compatibile"} con le opportunità attuali.
`
      : `
Analisi completata.

Nessun bando mostra una forte compatibilità.

Il progetto necessita di riallineamento su settore, fase o requisiti economici.
`;

    // =========================
    // 🧠 INSIGHTS
    // =========================

    const insights = [];

    if (score >= 70) {
      insights.push("Alta probabilità di accesso ai bandi principali");
    } else {
      insights.push("Serve ottimizzazione del posizionamento progettuale");
    }

    if (capital < 5000) {
      insights.push("Capitale basso riduce la competitività");
    }

    insights.push("Matching basato su regole deterministiche (no stime casuali)");

    // =========================
    // RESPONSE
    // =========================

    return {

      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },

      body: JSON.stringify({

        ai: {

          summary: narrative,

          compatibility_score: score,

          probability_financing: probability,

          insights

        },

        engine: {
          top3
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
