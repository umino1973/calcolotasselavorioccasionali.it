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

    const text = `${idea} ${sector}`;

    const results = BANDI.map(b => {

      let score = 0;
      let reasons = [];

      const sectorMatch =
        (b.sectors || []).some(s =>
          text.includes(s.toLowerCase())
        );

      if (sectorMatch) {
        score += 50;
        reasons.push("Settore compatibile");
      }

      if ((b.stages || []).includes(stage)) {
        score += 20;
        reasons.push("Fase progetto compatibile");
      }

      if ((b.regions || []).includes(region)) {
        score += 15;
        reasons.push("Area geografica compatibile");
      }

      if (
        capital >= b.min_capital &&
        capital <= b.max_capital
      ) {
        score += 15;
        reasons.push("Capitale compatibile");
      }

      // se non c'è match settore
      if (!sectorMatch && score > 60) {
        score = 60;
      }

      return {
        ...b,
        score,
        reasons
      };

    });

    results.sort((a,b) => b.score - a.score);

    const top3 = results.slice(0,3);

    const best = top3[0] || null;

    let compatibility = "🔴 Bassa";

    if (best && best.score >= 80)
      compatibility = "🟢 Alta";

    else if (best && best.score >= 60)
      compatibility = "🟡 Media";

    const fundingSuggestions = top3.map(b => {

      return `
<b>${b.name}</b> (${b.score}/100)
<br>
${b.reasons.map(r => "✔ " + r).join("<br>")}
`;

    });

    return {

      statusCode: 200,

      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },

      body: JSON.stringify({

        ai: {

          summary:
            best
              ? `Migliore opportunità individuata: ${best.name}.`
              : "Nessuna opportunità individuata.",

          compatibility_label:
            compatibility,

          strengths: [
            "Motore incentivi completato",
            "Analisi compatibilità eseguita"
          ],

          risks:
            best && best.score >= 60
              ? []
              : ["Compatibilità limitata con i bandi disponibili"],

          business_score:
            best
              ? best.score
              : 0,

          funding_suggestions:
            fundingSuggestions,

          next_steps: [
            "Studiare il bando principale",
            "Preparare business plan",
            "Verificare requisiti di accesso"
          ]

        }

      })

    };

  } catch (err) {

    return {

      statusCode: 200,

      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },

      body: JSON.stringify({

        ai: {

          summary: "Errore interno",

          compatibility_label: "🔴 Errore",

          strengths: [],

          risks: [
            err.message
          ],

          business_score: 0,

          funding_suggestions: [],

          next_steps: []

        }

      })

    };

  }

};
