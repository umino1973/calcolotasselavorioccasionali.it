
const BANDI = require("./bandi");

function norm(s) {
  return (s || "").toString().toLowerCase().trim();
}

// =========================
// 🧠 SCORE + EXPLANATION CORE
// =========================

function calculate(b, text, stage, region, capital) {

  let score = 0;
  let reasons = [];

  const sectors = (b.sectors || []).map(norm);
  const stages = (b.stages || []).map(norm);
  const regions = (b.regions || []).map(norm);

  if (sectors.some(s => text.includes(s))) {
    score += 40;
    reasons.push("settore coerente");
  }

  if (stages.includes(stage)) {
    score += 25;
    reasons.push("fase progetto compatibile");
  }

  if (regions.includes(region)) {
    score += 25;
    reasons.push("area geografica supportata");
  }

  if (capital >= b.min_capital && capital <= b.max_capital) {
    score += 10;
    reasons.push("capitale nel range corretto");
  }

  return { score, reasons };
}

// =========================
// 🧠 IDEA OPTIMIZATION ENGINE
// =========================

function optimizeIdea(idea, sector, stage, capital) {

  let improved = idea;
  let changes = [];

  // 1. verticalizzazione
  if (!idea.includes("AI") && !sector.includes("ai")) {
    improved += " con integrazione di AI per automazione e scalabilità";
    changes.push("Aggiunta componente AI per aumentare innovazione percepita");
  }

  // 2. trasformazione in sistema
  if (!idea.includes("piattaforma") && !idea.includes("software")) {
    improved = "piattaforma digitale: " + improved;
    changes.push("Trasformazione in piattaforma scalabile");
  }

  // 3. funding readiness
  if (capital < 10000) {
    changes.push("Incremento capitale iniziale migliora accesso ai bandi");
  }

  // 4. stage correction
  if (stage === "idea") {
    changes.push("Consigliato sviluppo MVP per aumentare bancabilità");
  }

  return { improved, changes };
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

      const { score, reasons } = calculate(
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
        reasons
      };

    }).sort((a, b) => b.score - a.score);

    const top = results[0];
    const baseScore = top?.score || 0;

    // =========================
    // 🧠 OPTIMIZATION
    // =========================

    const { improved, changes } = optimizeIdea(
      idea,
      sector,
      stage,
      capital
    );

    // recalcolo semplificato AFTER optimization
    const optimizedScore = Math.min(100, baseScore + changes.length * 6);

    const delta = optimizedScore - baseScore;

    // =========================
    // 🧠 NARRATIVE
    // =========================

    const narrative = `
Il tuo progetto è stato analizzato e può essere migliorato in modo concreto per aumentare la probabilità di accesso ai finanziamenti.

📊 SITUAZIONE ATTUALE
- Score attuale: ${baseScore}/100

📈 DOPO OTTIMIZZAZIONE
- Score potenziale: ${optimizedScore}/100
- Miglioramento stimato: +${delta} punti

🧠 NUOVA VERSIONE DEL PROGETTO:
${improved}

🔧 MIGLIORAMENTI APPLICABILI:
${changes.map(c => `- ${c}`).join("\n")}

👉 INTERPRETAZIONE:
Non è l’idea a essere debole, ma il suo posizionamento strategico.

Con le modifiche suggerite, il progetto diventa significativamente più competitivo nei confronti dei bandi disponibili.
`;

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

          compatibility_score: baseScore,

          optimized_score: optimizedScore,

          improvement_delta: delta,

          improved_idea: improved,

          changes

        },

        engine: {
          top_match: top
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
