exports.handler = async (event) => {
  try {

    console.log("V8.1 INCUBATOR STARTED");

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" })
      };
    }

    const { idea, sector, stage, region, capital } =
      JSON.parse(event.body || "{}");

    const cap = Number(capital || 0);
    const text = `${idea} ${sector}`.toLowerCase();

    // =========================
    // 📦 BANDI V8.1 (REALISTIC RULES)
    // =========================

    const BANDI_DB = [
      {
        name: "Smart&Start Italia",
        entity: "Invitalia",
        link: "https://www.invitalia.it/cosa-facciamo/creiamo-nuove-aziende/smartstart-italia",
        sectors: ["ai", "tech", "digital", "servizi"],
        stages: ["idea", "mvp", "startup"],
        regions: ["italy"],
        min_capital: 0,
        max_capital: 1500000,
        base_coverage: 0.8
      },
      {
        name: "Horizon Europe - EIC Accelerator",
        entity: "European Commission",
        link: "https://eic.ec.europa.eu",
        sectors: ["ai", "deeptech", "innovation"],
        stages: ["startup"],
        regions: ["eu"],
        min_capital: 0,
        max_capital: 9999999,
        base_coverage: 0.7
      },
      {
        name: "Fondo Lombardia Start",
        entity: "Regione Lombardia",
        link: "https://www.bandi.regione.lombardia.it",
        sectors: ["servizi", "innovazione"],
        stages: ["idea", "mvp"],
        regions: ["lombardia"],
        min_capital: 5000,
        max_capital: 100000,
        base_coverage: 0.5
      }
    ];

    // =========================
    // 🎯 REAL SCORING ENGINE (NO FAKE 100%)
    // =========================

    let results = [];

    for (const b of BANDI_DB) {

      const sectorMatch = b.sectors.some(s => text.includes(s));
      const stageMatch = b.stages.includes(stage);
      const regionMatch = b.regions.includes(region.toLowerCase());
      const capitalMatch = cap >= b.min_capital && cap <= b.max_capital;

      // ❌ hard exclusion
      if (!sectorMatch && !stageMatch && !regionMatch) continue;

      // 📊 realistic scoring (0–100)
      let score = 0;

      if (sectorMatch) score += 35;
      if (stageMatch) score += 25;
      if (regionMatch) score += 25;
      if (capitalMatch) score += 15;

      // 📉 penalità realismo
      if (!capitalMatch) score -= 10;

      score = Math.max(0, Math.min(100, score));

      // 🎯 eligibility threshold reale
      const eligible = score >= 45;

      if (!eligible) continue;

      // 📈 probability REALISTIC
      let probability =
        score >= 75 ? "high" :
        score >= 55 ? "medium" :
        "low";

      results.push({
        name: b.name,
        entity: b.entity,
        link: b.link,
        score,
        probability,
        eligible: true,
        coverage: b.base_coverage,
        reason: "Requisiti compatibili con il profilo inserito"
      });
    }

    // sort best first
    results.sort((a, b) => b.score - a.score);

    const top = results.slice(0, 5);

    // =========================
    // 💰 FUNDING ESTIMATE REALISTIC
    // =========================

    const maxFund = top.length
      ? Math.max(...top.map(b => b.coverage * 500000))
      : 25000;

    const conservative = Math.round(maxFund * 0.2);
    const realistic = Math.round(maxFund * 0.4);
    const optimistic = Math.round(maxFund * 0.65);

    // =========================
    // 🚀 RESPONSE CLEAN (NO UNDEFINED)
    // =========================

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        business_summary: `Analisi incubatore V8.1 per ${sector}`,
        funding_opportunities: top,
        funding_estimate: {
          conservative,
          realistic,
          optimistic
        },
        overall_score: top.length ? top[0].score : 10,
        next_action: top.length
          ? `Candidati a ${top[0].name}`
          : "Nessun bando compatibile: migliora idea o capitale"
      })
    };

  } catch (err) {
    console.log("V8.1 ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
