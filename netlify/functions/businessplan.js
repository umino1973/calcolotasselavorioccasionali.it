exports.handler = async (event) => {
  console.log("🔥 BUSINESSPLAN FUNCTION START (V12 STABLE)");

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
    const stage = (body.stage || "").toLowerCase().trim();
    const region = (body.region || "").toLowerCase().trim();
    const capital = Number(body.capital || 0);

    const text = `${idea} ${sector}`;

    // =========================
    // 📦 BANDI (SAFE INLINE)
    // =========================

    const BANDI = [
      {
        name: "Smart&Start Italia",
        entity: "Invitalia",
        link: "https://www.invitalia.it",
        sectors: ["ai", "tech", "digital", "servizi"],
        stages: ["idea", "mvp", "startup"],
        regions: ["italy"],
        min_capital: 0,
        max_capital: 1500000,
        coverage: 0.8,
        requirements: ["Startup innovativa", "Sede in Italia"]
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
        coverage: 0.5,
        requirements: ["Sede Lombardia", "Early stage"]
      },
      {
        name: "Horizon Europe",
        entity: "European Commission",
        link: "https://eic.ec.europa.eu",
        sectors: ["ai", "deeptech"],
        stages: ["startup"],
        regions: ["eu"],
        min_capital: 0,
        max_capital: 9999999,
        coverage: 0.7,
        requirements: ["Innovazione UE", "Scalabilità"]
      }
    ];

    // =========================
    // 🎯 ENGINE
    // =========================

    const results = [];

    for (const b of (BANDI || [])) {

      const checks = {
        sector: (b.sectors || []).some(s =>
          text.includes(s)
        ),

        stage: (b.stages || []).includes(stage),

        region: (b.regions || []).some(r =>
          region.includes(r)
        ),

        capital:
          capital >= (b.min_capital || 0) &&
          capital <= (b.max_capital || 999999999)
      };

      const passed = Object.values(checks).filter(Boolean).length;

      const score =
        (checks.sector ? 30 : 0) +
        (checks.stage ? 25 : 0) +
        (checks.region ? 25 : 0) +
        (checks.capital ? 20 : 0);

      const status =
        passed === 4 ? "ELIGIBLE" :
        passed >= 2 ? "PARTIAL" :
        "EXCLUDED";

      const probability =
        score >= 75 ? "high" :
        score >= 50 ? "medium" :
        "low";

      const missing = [];
      if (!checks.sector) missing.push("Settore non coerente");
      if (!checks.stage) missing.push("Fase non idonea");
      if (!checks.region) missing.push("Regione non valida");
      if (!checks.capital) missing.push("Capitale non compatibile");

      const upgrade_path =
        status === "ELIGIBLE"
          ? ["Preparare business plan", "Raccogliere documenti", "Inviare candidatura"]
          : ["Adattare progetto al bando", "Colmare requisiti mancanti", "Rivalutare strategia"];

      results.push({
        name: b.name,
        entity: b.entity,
        link: b.link,
        score,
        status,
        probability,
        requirements: b.requirements,
        missing,
        upgrade_path,
        coverage: b.coverage
      });
    }

    const eligible = results.filter(r => r.status === "ELIGIBLE");
    const partial = results.filter(r => r.status === "PARTIAL");
    const excluded = results.filter(r => r.status === "EXCLUDED");

    eligible.sort((a, b) => b.score - a.score);

    const top = eligible.slice(0, 5);

    // =========================
    // 💰 FUNDING
    // =========================

    const maxFund = top.length
      ? Math.max(...top.map(b => b.coverage * 500000))
      : 20000;

    const conservative = Math.round(maxFund * 0.3);
    const realistic = Math.round(maxFund * 0.5);
    const optimistic = Math.round(maxFund * 0.75);

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
        business_summary: `Analisi V12 per ${sector || "startup"}`,

        eligible,
        partial,
        excluded,

        funding_opportunities: top,

        funding_estimate: {
          conservative,
          realistic,
          optimistic
        },

        overall_score: top.length ? top[0].score : 10,

        next_action: top.length
          ? `Procedi con ${top[0].name}`
          : "Nessun bando idoneo: rivedere strategia"
      })
    };

  } catch (err) {

    console.log("❌ ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message || "Unknown error"
      })
    };
  }
};
