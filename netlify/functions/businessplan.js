
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
        score,
        sectors,
        stages,
        regions
      };

    }).sort((a, b) => b.score - a.score);

    const top3 = scored.slice(0, 3);
    const best = top3[0];

    const currentScore = best?.score || 0;

    // =========================
    // 🧠 DIAGNOSI STRATEGICA
    // =========================

    let diagnosis = [];
    let improvements = [];

    if (!best) {
      diagnosis.push("Il progetto non è ancora chiaramente posizionato su un bando specifico.");
    } else {
      diagnosis.push(`Il progetto è attualmente più vicino a: ${best.name}`);
    }

    if (currentScore < 50) {
      diagnosis.push("Il livello di compatibilità è basso: serve riallineamento strategico.");
    } else if (currentScore < 80) {
      diagnosis.push("Buona base, ma con margine di ottimizzazione significativo.");
    } else {
      diagnosis.push("Ottima compatibilità con strumenti di finanziamento attivi.");
    }

    // =========================
    // 🧠 COME MIGLIORARE SCORE
    // =========================

    if (!scored.some(b => b.sectors.includes(sector))) {
      improvements.push("Rafforza il posizionamento del settore (descrizione più specifica e meno generica)");
    }

    if (!best || !best.stages.includes(stage)) {
      improvements.push("Allinea meglio lo stadio del progetto (idea / MVP / startup)");
    }

    if (!best || best.score < 70) {
      improvements.push("Considera una revisione del target geografico o del mercato");
    }

    if (capital < 5000) {
      improvements.push("Incrementare capitale iniziale migliora fortemente l’accesso ai bandi");
    }

    if (improvements.length === 0) {
      improvements.push("Progetto già ben strutturato per accesso ai bandi principali");
    }

    // =========================
    // 🧠 NARRAZIONE CONSULENZIALE
    // =========================

    const narrative = `
Il tuo progetto si colloca in un’area di innovazione con un livello di compatibilità attuale pari a ${currentScore}/100.

Questo significa che esistono reali opportunità di accesso a finanziamenti pubblici, ma la qualità dell’allineamento dipende da alcuni fattori chiave: posizionamento del settore, fase di sviluppo e coerenza territoriale.

Dal punto di vista strategico, il sistema ha identificato ${best ? "una chiara direzione di riferimento" : "una necessità di ridefinizione del posizionamento"}.

L’obiettivo non è solo trovare un bando, ma aumentare la “finanziabilità” del progetto attraverso ottimizzazioni mirate.
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

          compatibility_score: currentScore,

          probability_financing:
            currentScore >= 80 ? 90 :
            currentScore >= 60 ? 70 :
            currentScore >= 40 ? 50 : 25,

          diagnosis,

          improvements,

          recommendations: best
            ? [
                `Approfondire bando: ${best.name}`,
                "Raffinare descrizione progetto per aumentare matching",
                "Preparare documentazione strutturata"
              ]
            : [
                "Ridefinire il posizionamento del progetto",
                "Specificare meglio settore e mercato",
                "Riconsiderare fase di sviluppo"
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
