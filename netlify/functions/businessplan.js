
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

    const scored = BANDI.map(b => {

      let score = 0;
      let reasons = [];

      const sectors = (b.sectors || []).map(norm);
      const stages = (b.stages || []).map(norm);
      const regions = (b.regions || []).map(norm);

      // SECTOR MATCH
      if (sectors.some(s => text.includes(s))) {
        score += 40;
        reasons.push("Il settore è perfettamente allineato al bando");
      }

      // STAGE MATCH
      if (stages.includes(stage)) {
        score += 25;
        reasons.push("Lo stadio del progetto è coerente con i requisiti");
      }

      // REGION MATCH
      if (regions.includes(region)) {
        score += 25;
        reasons.push("La localizzazione geografica è compatibile");
      }

      // CAPITAL MATCH
      if (capital >= b.min_capital && capital <= b.max_capital) {
        score += 10;
        reasons.push("Il capitale disponibile rientra nei parametri del bando");
      }

      if (score === 0) {
        reasons.push("Il progetto non mostra ancora forte allineamento con questo bando");
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

    // =========================
    // 🧠 ANALISI UMANA
    // =========================

    const narrative = best
      ? `
Il tuo progetto mostra una buona compatibilità con il bando "${best.name}", che al momento risulta la migliore opportunità disponibile.

Questo significa che l’idea imprenditoriale che hai descritto rientra in un contesto già supportato da strumenti pubblici attivi, soprattutto per quanto riguarda settore, fase di sviluppo e requisiti economici.

In particolare, il sistema ha identificato che:
- il posizionamento del progetto è coerente con le linee di finanziamento disponibili
- esiste una reale possibilità di accesso a contributi o agevolazioni
- il livello di maturità dell’idea è adeguato per questo tipo di incentivo

Tuttavia, è importante considerare che la competitività del bando richiede una progettazione strutturata e una documentazione ben preparata.
`
      : `
Il tuo progetto al momento non mostra un forte allineamento con i principali bandi disponibili nel sistema.

Questo non significa che non sia finanziabile, ma che potrebbe essere necessario:
- rivedere il posizionamento del settore
- chiarire meglio lo stadio di sviluppo
- o ampliare la ricerca di strumenti di finanziamento più adatti
`;

    const strengths = [];

    if (best?.score >= 70) {
      strengths.push("Elevata coerenza con strumenti di finanziamento attivi");
    }

    if (capital > 0) {
      strengths.push("Presenza di capitale iniziale che migliora la bancabilità del progetto");
    }

    strengths.push("Analisi automatica basata su matching reale con bandi attivi");

    const risks = [];

    if (!best || best.score < 60) {
      risks.push("Allineamento non ancora ottimale con strumenti pubblici disponibili");
    }

    if (capital < 5000) {
      risks.push("Capitale iniziale limitato rispetto a progetti competitivi");
    }

    return {

      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },

      body: JSON.stringify({

        ai: {

          summary: narrative,

          compatibility_score: best?.score || 0,

          probability_financing:
            best?.score >= 80 ? 90 :
            best?.score >= 60 ? 70 :
            best?.score >= 40 ? 50 : 25,

          strengths,

          risks,

          recommendations: best
            ? [
                `Approfondire il bando: ${best.name}`,
                "Preparare una versione strutturata del business plan",
                "Raccogliere documentazione necessaria per la candidatura"
              ]
            : [
                "Rivedere settore o posizionamento dell’idea",
                "Ampliare la ricerca di bandi regionali e nazionali",
                "Rafforzare la struttura del progetto imprenditoriale"
              ]
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
