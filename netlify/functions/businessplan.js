const BANDI = require("./bandi");

exports.handler = async (event) => {

  try {

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({
          error: "Method Not Allowed"
        })
      };
    }

    const body = JSON.parse(event.body || "{}");

    const idea = (body.idea || "").toLowerCase();
    const sector = (body.sector || "").toLowerCase();
    const stage = (body.stage || "").toLowerCase();
    const region = (body.region || "").toLowerCase();
    const capital = Number(body.capital || 0);

    // =========================
    // CARICA BANDI
    // =========================

  
console.log("DB PATH:", dbPath);

      const raw = fs.readFileSync(
        dbPath,
        "utf8"
      );

      BANDI = JSON.parse(raw);

    } catch (err) {

      return {
        statusCode: 200,
        body: JSON.stringify({
          ai: {
            summary: "Impossibile leggere bandi.json",
            strengths: [],
            risks: [err.message],
            business_score: 0,
            funding_suggestions: [],
            next_steps: ["Verificare data/bandi.json"]
          },
          debug: {
            error: err.message
          }
        })
      };
    }

    // =========================
    // SCORING
    // =========================

    const text = `${idea} ${sector}`;

    const results = BANDI.map(b => {

      let score = 0;

      const sectorMatch =
        (b.sectors || []).some(s =>
          text.includes(
            s.toLowerCase()
          )
        );

      if (sectorMatch)
        score += 40;

      if (
        (b.stages || [])
          .includes(stage)
      )
        score += 25;

      if (
        (b.regions || [])
          .includes(region)
      )
        score += 20;

      if (
        capital >= b.min_capital &&
        capital <= b.max_capital
      )
        score += 15;

      return {
        ...b,
        score
      };

    });

    results.sort(
      (a,b) => b.score - a.score
    );

    const top3 = results.slice(0,3);

    const best = top3[0];

    // =========================
    // REPORT
    // =========================

    const strengths = [];

    if (best && best.score >= 70)
      strengths.push(
        "Buona compatibilità con incentivi esistenti"
      );

    if (capital > 0)
      strengths.push(
        "Disponibilità di capitale iniziale"
      );

    if (
      region === "lombardia"
    )
      strengths.push(
        "Regione con numerosi strumenti di sostegno"
      );

    const risks = [];

    if (
      !best ||
      best.score < 50
    ) {
      risks.push(
        "Compatibilità limitata con i bandi attuali"
      );
    }

    if (
      capital < 5000
    ) {
      risks.push(
        "Capitale iniziale ridotto"
      );
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type":
          "application/json",
        "Access-Control-Allow-Origin":
          "*"
      },

      body: JSON.stringify({

        ai: {

          summary:
            `Analisi completata. Migliore opportunità individuata: ${best ? best.name : "nessuna"}.`,

          strengths,

          risks,

          business_score:
            best
              ? best.score
              : 10,

          funding_suggestions:
            top3.map(
              x => x.name
            ),

          next_steps: [
            "Verificare requisiti del bando principale",
            "Preparare business plan",
            "Analizzare documentazione richiesta"
          ]

        },

        debug: {

          total_bandi:
            BANDI.length,

          best_match:
            best
              ? best.name
              : null

        }

      })

    };

  } catch (err) {

    return {

      statusCode: 200,

      body: JSON.stringify({

        ai: {

          summary:
            "Errore interno",

          strengths: [],

          risks: [
            err.message
          ],

          business_score: 0,

          funding_suggestions: [],

          next_steps: []

        },

        debug: {

          error:
            err.message

        }

      })

    };

  }

};
