
const BANDI = require("./bandi");

function norm(s) {
  return (s || "").toString().toLowerCase().trim();
}

// =========================
// 🧠 SCORE ENGINE (TRASPARENTE)
// =========================

function evaluate(b, text, stage, region, capital) {

  let score = 0;

  const evidence = {
    sector: false,
    stage: false,
    region: false,
    capital: false
  };

  const sectors = (b.sectors || []).map(norm);
  const stages = (b.stages || []).map(norm);
  const regions = (b.regions || []).map(norm);

  if (sectors.some(s => text.includes(s))) {
    score += 40;
    evidence.sector = true;
  }

  if (stages.includes(stage)) {
    score += 25;
    evidence.stage = true;
  }

  if (regions.includes(region)) {
    score += 25;
    evidence.region = true;
  }

  if (capital >= b.min_capital && capital <= b.max_capital) {
    score += 10;
    evidence.capital = true;
  }

  return { score, evidence };
}

// =========================
// 🧠 REASONING ENGINE
// =========================

function buildAnalysis(b, score, evidence) {

  const analysis = [];

  // SECTOR
  analysis.push({
    factor: "Settore",
    result: evidence.sector ? "Compatibile" : "Non compatibile",
    impact: evidence.sector ? "+40 punti" : "0 punti",
    meaning: evidence.sector
      ? "Il progetto è allineato alle aree di investimento del bando"
      : "Il settore dichiarato non rientra tra quelli prioritari"
  });

  // STAGE
  analysis.push({
    factor: "Fase progetto",
    result: evidence.stage ? "Compatibile" : "Non compatibile",
    impact: evidence.stage ? "+25 punti" : "0 punti",
    meaning: evidence.stage
      ? "La maturità del progetto è coerente con il bando"
      : "Il livello di sviluppo non è adeguato al bando"
  });

  // REGION
  analysis.push({
    factor: "Area geografica",
    result: evidence.region ? "Compatibile" : "Non compatibile",
    impact: evidence.region ? "+25 punti" : "0 punti",
    meaning: evidence.region
      ? "Il bando supporta la regione indicata"
      : "Il territorio non è coperto dal programma"
  });

  // CAPITAL
  analysis.push({
    factor: "Capitale",
    result: evidence.capital ? "Compatibile" : "Non compatibile",
    impact: evidence.capital ? "+10 punti" : "0 punti",
    meaning: evidence.capital
      ? "Il budget rientra nei parametri richiesti"
      : "Il capitale è fuori dal range finanziabile"
  });

  return analysis;
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

    const results = BANDI.map(b => {

      const { score, evidence } = evaluate(
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
        evidence,
        analysis: buildAnalysis(b, score, evidence)
      };

    }).sort((a, b) => b.score - a.score);

    const top3 = results.slice(0, 3);
    const best = top3[0];

    const score = best?.score || 0;
    const probability = Math.round(score * 0.9);

    // =========================
    // 🧠 DECISION LOGIC
    // =========================

    const decision =
      score >= 80
        ? "Alta probabilità di accesso ai finanziamenti"
        : score >= 50
          ? "Accesso possibile ma da ottimizzare"
          : "Bassa compatibilità con bandi attuali";

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

          decision,

          score,

          probability_financing: probability,

          best_match: best?.name || null,

          structured_analysis: best?.analysis || [],

          interpretation: `
Il punteggio è costruito su 4 fattori indipendenti.
Ogni fattore contribuisce in modo deterministico al risultato finale.

Non esistono stime arbitrarie: ogni punto è tracciabile a un criterio specifico.
          `.trim()
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
