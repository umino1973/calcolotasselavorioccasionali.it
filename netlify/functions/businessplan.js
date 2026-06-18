
const BANDI = require("./bandi");

function norm(s) {
  return (s || "").toString().toLowerCase().trim();
}

// =========================
// 🧠 CORE LOGIC
// =========================

function probabilityFromScore(score) {
  if (score >= 85) return 88;
  if (score >= 70) return 72;
  if (score >= 50) return 55;
  if (score >= 30) return 35;
  return 15;
}

function bandLevel(score) {
  if (score >= 85) return "Eccellente compatibilità";
  if (score >= 70) return "Alta compatibilità";
  if (score >= 50) return "Compatibilità media";
  if (score >= 30) return "Compatibilità bassa";
  return "Compatibilità molto bassa";
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
    // 🧠 SCORING ENGINE (UNICO FONTE VERITÀ)
    // =========================

    const scored = BANDI.map(b => {

      let score = 0;
      let reasons = [];

      const sectors = (b.sectors || []).map(norm);
      const stages = (b.stages || []).map(norm);
      const regions = (b.regions || []).map(norm);

      if (sectors.some(s => text.includes(s))) {
        score += 40;
        reasons.push("Il settore è coerente con il bando");
      }

      if (stages.includes(stage)) {
        score += 25;
        reasons.push("La fase del progetto è compatibile");
      }

      if (regions.includes(region)) {
        score += 25;
        reasons.push("La regione è supportata dal bando");
      }

      if (capital >= b.min_capital && capital <= b.max_capital) {
        score += 10;
        reasons.push("Il capitale rientra nei parametri richiesti");
      }

      return {
        name: b.name,
        entity: b.entity,
        score,
        reasons
      };

    }).sort((a, b) => b.score - a.score);

    const top3 = scored.slice(0, 3);
    const best = top3[0];

    const score = best?.score || 0;
    const probability = probabilityFromScore(score);

    const level = bandLevel(score);

    // =========================
    // 🧠 NARRAZIONE CONSULENTE REALE
    // =========================

    const narrative = best
      ? `
Analisi del progetto imprenditoriale completata.

Il sistema ha identificato una principale opportunità di finanziamento: ${best.name}.

📊 Valutazione tecnica:
- Livello di compatibilità: ${level}
- Score complessivo: ${score}/100
- Probabilità stimata di accesso: ${probability}%

Interpretazione:

Il progetto presenta una struttura coerente con i requisiti del bando analizzato. In particolare, gli elementi più rilevanti sono la coerenza settoriale e l’allineamento con la fase di sviluppo dichiarata.

Questo indica che il progetto non è solo teoricamente valido, ma potenzialmente candidabile con una corretta preparazione della documentazione.

Dal punto di vista strategico, il progetto è in una fase in cui ottimizzazioni mirate possono aumentare significativamente le probabilità di successo.
`
      : `
Analisi del progetto completata.

Non è stata identificata una corrispondenza forte con i principali strumenti di finanziamento disponibili.

📊 Valutazione tecnica:
- Livello di compatibilità: Bassa
- Score complessivo: ${score}/100
- Probabilità stimata di accesso: ${probability}%

Interpretazione:

Il progetto necessita di una revisione del posizionamento strategico per aumentare la compatibilità con i bandi pubblici.

Non si tratta di un’idea non valida, ma di un problema di allineamento tra descrizione, settore e strumenti disponibili.
`;

    // =========================
    // 🧠 ACTIONABLE INSIGHTS
    // =========================

    const insights = [];

    if (score >= 70) {
      insights.push("Progetto già candidabile con buona probabilità di accesso ai fondi");
    } else {
      insights.push("Necessario rafforzare il posizionamento del progetto");
    }

    if (capital < 5000) {
      insights.push("Aumentare capitale iniziale migliora significativamente la bancabilità");
    }

    if (!sector || sector.length < 3) {
      insights.push("Descrizione del settore troppo generica: serve maggiore specificità");
    }

    const recommendations = best
      ? [
          `Approfondire requisiti di ${best.name}`,
          "Preparare business plan strutturato",
          "Validare coerenza documentale prima della candidatura"
        ]
      : [
          "Ridefinire il posizionamento del progetto",
          "Analizzare bandi regionali alternativi",
          "Ristrutturare la proposta di valore"
        ];

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

          level,

          insights,

          recommendations
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
