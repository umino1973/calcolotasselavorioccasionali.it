
const BANDI = require("./bandi");

function norm(s) {
  return (s || "").toString().toLowerCase().trim();
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
    // 🧠 SCORING ENGINE
    // =========================

    const scored = BANDI.map(b => {

      let score = 0;

      const sectors = (b.sectors || []).map(norm);
      const stages = (b.stages || []).map(norm);
      const regions = (b.regions || []).map(norm);

      if (sectors.some(s => text.includes(s))) score += 40;
      if (stages.includes(stage)) score += 25;
      if (regions.includes(region)) score += 25;
      if (capital >= b.min_capital && capital <= b.max_capital) score += 10;

      return {
        name: b.name,
        entity: b.entity,
        score
      };

    }).sort((a, b) => b.score - a.score);

    const top = scored[0];
    const baseScore = top?.score || 0;

    // =========================
    // 🧠 IDEA OPTIMIZATION CORE
    // =========================

    let improvedIdea = idea;

    let suggestions = [];

    // 1. settorializzazione
    if (sector.length < 5) {
      suggestions.push("Rendi il settore più specifico (es: non 'servizi', ma 'AI per servizi domiciliari')");
      improvedIdea = improvedIdea + " con focus su applicazione AI verticale nel settore selezionato";
    }

    // 2. trasformazione startup
    if (!idea.includes("piattaforma") && !idea.includes("software")) {
      suggestions.push("Trasforma l'idea in piattaforma scalabile o prodotto digitale");
    }

    // 3. funding angle
    if (capital < 10000) {
      suggestions.push("Aggiungi leva iniziale: anche piccolo capitale aumenta bancabilità");
    }

    // 4. AI positioning
    suggestions.push("Posiziona l’idea come soluzione innovativa ad alta scalabilità europea");

    // =========================
    // 🧠 SIMULAZIONE DOPO MIGLIORAMENTI
    // =========================

    const improvedScore = Math.min(100, baseScore + 15 + (sector ? 10 : 0));

    const delta = improvedScore - baseScore;

    // =========================
    // 🧠 OUTPUT STRATEGICO
    // =========================

    const narrative = `
Il tuo progetto è stato analizzato non solo per compatibilità attuale, ma anche per potenziale di miglioramento strategico.

📊 Situazione attuale:
- Score attuale: ${baseScore}/100
- Score ottimizzato: ${improvedScore}/100
- Potenziale miglioramento: +${delta} punti

Questo significa che l’idea non è statica: può diventare significativamente più finanziabile con modifiche mirate.

L’obiettivo non è cambiare l’idea, ma raffinarne il posizionamento strategico.
`;

    const best = top;

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

          optimized_score: improvedScore,

          improvement_potential: delta,

          improved_idea: improvedIdea,

          suggestions,

          recommendations: [
            "Riformulare il posizionamento dell’idea in ottica scalabile",
            "Integrare AI come elemento centrale del modello",
            "Validare la versione ottimizzata con bandi target"
          ]
        },

        engine: {
          top_match: best
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
