exports.handler = async (event) => {

  console.log("BUSINESSPLAN V3 START");

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
    // 📦 BANDI
    // =========================

const fs = require("fs");
const path = require("path");

const dbPath = path.join(process.cwd(), "data", "bandi.json");

let BANDI = [];

try {
  BANDI = JSON.parse(fs.readFileSync(dbPath, "utf8"));
} catch (err) {
  console.log("Fallback bandi attivo");
  BANDI = [];
}

    // =========================
    // 🧠 SCORING V3 (soft + realistico)
    // =========================

    function scoreBando(b) {

      let score = 0;

      const semanticHits = b.signals.filter(s => text.includes(s));

      score += semanticHits.length * 20;

      if (b.regions.includes(region)) score += 30;
      else if (b.regions.includes("eu")) score += 10;

      if (b.stages.includes(stage)) score += 20;
      else score -= 5;

      if (capital >= b.min_capital && capital <= b.max_capital) score += 20;
      else score -= 10;

      return Math.max(0, Math.min(100, Math.round(score)));
    }

    const results = BANDI.map(b => ({
      name: b.name,
      entity: b.entity,
      score: scoreBando(b)
    }));

    const sorted = results.sort((a, b) => b.score - a.score);
    const best = sorted[0];

    // =========================
    // 🧠 REPORT UMANO AI (V3)
    // =========================

    const diagnosis =
      best.score > 75
        ? `La tua idea è ben allineata ai finanziamenti pubblici disponibili nel settore ${sector}.`
        : best.score > 45
        ? `La tua idea è parzialmente finanziabile, ma richiede un adattamento strategico per aumentare le probabilità di successo.`
        : `La tua idea non è attualmente ben allineata ai bandi disponibili e necessita riposizionamento.`;

    const strategy =
      best.score > 75
        ? `Il bando più adatto è ${best.name}. Ti conviene preparare subito la candidatura ottimizzata.`
        : `Conviene prima migliorare il posizionamento del progetto e poi puntare a bandi regionali o startup.`;

    const risks = [
      "Allineamento parziale con i criteri dei bandi",
      "Fase progettuale non ancora completamente strutturata",
      "Competizione elevata nei bandi più accessibili"
    ];

    const plan = [
      "Raffinare la descrizione del progetto in chiave innovativa",
      "Identificare requisiti specifici del bando principale",
      "Preparare un business plan sintetico",
      "Definire budget e utilizzo fondi",
      "Verificare requisiti territoriali"
    ];

    const finalAdvice =
      best.score > 75
        ? "Procedi subito con la candidatura: il tuo progetto è competitivo."
        : "Prima di candidarti, migliora il posizionamento strategico per aumentare le probabilità di successo.";

    // =========================
    // 🚀 RESPONSE
    // =========================

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        diagnosis,
        strategy,
        risks,
        plan,
        finalAdvice,
        best_match: best,
        all_results: sorted
      })
    };

  } catch (err) {

    console.log("ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
