const fs = require("fs");
const path = require("path");

exports.handler = async () => {

  try {

    console.log("UPDATE BANDI START");

    // =========================
    // 🌐 FONTI UFFICIALI (SIMULATE ORA)
    // =========================

    const sources = [
      {
        source: "invitalia",
        data: [
          {
            name: "Smart&Start Italia",
            entity: "Invitalia",
            regions: ["italy"],
            signals: ["startup", "innovazione", "ai", "tech"],
            stages: ["idea", "mvp", "startup"],
            min_capital: 0,
            max_capital: 1500000
          }
        ]
      },
      {
        source: "lombardia",
        data: [
          {
            name: "Fondo Lombardia Start",
            entity: "Regione Lombardia",
            regions: ["lombardia"],
            signals: ["servizi", "badanti", "pmi"],
            stages: ["idea", "mvp"],
            min_capital: 5000,
            max_capital: 100000
          }
        ]
      }
    ];

    // =========================
    // 🧠 NORMALIZZAZIONE
    // =========================

    let allBandi = [];

    for (const s of sources) {
      allBandi = allBandi.concat(s.data);
    }

    // =========================
    // 💾 SALVATAGGIO
    // =========================

    const filePath = path.join(process.cwd(), "data", "bandi.json");

    fs.writeFileSync(filePath, JSON.stringify(allBandi, null, 2));

    console.log("UPDATE COMPLETED:", allBandi.length);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        updated: allBandi.length
      })
    };

  } catch (err) {

    console.log("UPDATE ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
