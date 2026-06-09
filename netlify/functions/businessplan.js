exports.handler = async (event) => {
  try {

    console.log("V8 INCUBATOR STARTED");

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" })
      };
    }

    const { idea, sector, stage, region, capital } =
      JSON.parse(event.body || "{}");

    // =========================
    // 📦 BANDI CON REQUISITI REALI
    // =========================

    const BANDI_DB = [
      {
        name: "Smart&Start Italia",
        entity: "Invitalia",
        link: "https://www.invitalia.it/cosa-facciamo/creiamo-nuove-aziende/smartstart-italia",
        sectors: ["ai", "tech", "digital", "servizi"],
        stage_allowed: ["idea", "mvp", "startup"],
        region_allowed: ["italy"],
        min_capital: 0,
        max_capital: 1500000,
        coverage: 0.9,
        rules: "Startup innovativa registrata o in costituzione"
      },
      {
        name: "Horizon Europe - EIC Accelerator",
        entity: "European Commission",
        link: "https://eic.ec.europa.eu",
        sectors: ["ai", "deeptech", "innovation"],
        stage_allowed: ["startup"],
        region_allowed: ["eu"],
        min_capital: 0,
        max_capital: 2500000,
        coverage: 0.7,
        rules: "Startup scalabile deep tech con alto potenziale innovativo"
      },
      {
        name: "Fondo Lombardia Start",
        entity: "Regione Lombardia",
        link: "https://www.bandi.regione.lombardia.it",
        sectors: ["servizi", "innovazione"],
        stage_allowed: ["idea", "mvp"],
        region_allowed: ["lombardia"],
        min_capital: 5000,
        max_capital: 100000,
        coverage: 0.5,
        rules: "Impresa con sede in Lombardia"
      }
    ];

    const text = `${idea} ${sector}`.toLowerCase();
    const cap = Number(capital || 0);

    // =========================
    // 🎯 MATCHING REALE (ELEGIBILITY ENGINE)
    // =========================

    let results = [];

    for (const b of BANDI_DB) {

      let eligible = true;
      let reasons = [];

      // settore
      const sectorMatch = b.sectors.some(s => text.includes(s));
      if (!sectorMatch) {
        eligible = false;
        reasons.push("settore non coerente");
      }

      // stage
      if (!b.stage_allowed.includes(stage)) {
        eligible = false;
        reasons.push("fase aziendale non idonea");
      }

      // regione
      if (!b.region_allowed.includes(region.toLowerCase())) {
        eligible = false;
        reasons.push("area geografica non ammessa");
      }

      // capitale
      if (cap < b.min_capital || cap > b.max_capital) {
        eligible = false;
        reasons.push("capitale non compatibile");
      }

      // score realistico
      let score = 0;
      if (sectorMatch) score += 40;
      if (b.stage_allowed.includes(stage)) score += 30;
      if (b.region_allowed.includes(region.toLowerCase())) score += 20;
      if (cap >= b.min_capital && cap <= b.max_capital) score += 10;

      results.push({
        name: b.name,
        entity: b.entity,
        link: b.link,
        eligible,
        compatibility_score: score,
        probability: eligible ? "medium-high" : "low",
        reason: eligible ? "Sei idoneo al bando" : reasons.join(", "),
        coverage: b.coverage
      });
    }

    const eligibleOnly = results.filter(r => r.eligible);

    eligibleOnly.sort((a, b) => b.compatibility_score - a.compatibility_score);

    const top = eligibleOnly.slice(0, 5);

    // =========================
    // 💰 STIMA REALISTICA
    // =========================

    const maxFunding = top.length
      ? Math.max(...top.map(b => b.coverage * 1000000))
      : 30000;

    const conservative = Math.round(maxFunding * 0.2);
    const realistic = Math.round(maxFunding * 0.4);
    const optimistic = Math.round(maxFunding * 0.7);

    // =========================
    // 🚀 OUTPUT
    // =========================

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        business_summary: `Analisi incubatore V8 per settore ${sector}`,
        funding_opportunities: top,
        funding_estimate: {
          conservative,
          realistic,
          optimistic
        },
        overall_score: top.length ? top[0].compatibility_score : 15,
        next_action: top.length
          ? `Sei idoneo: candidati a ${top[0].name}`
          : "Nessun bando compatibile: raffina idea o cambia regione"
      })
    };

  } catch (err) {
    console.log("V8 ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
