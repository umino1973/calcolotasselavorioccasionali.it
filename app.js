
async function generateFunding() {

  const output = document.getElementById("output");

  const idea = document.getElementById("idea")?.value || "";
  const sector = document.getElementById("sector")?.value || "";
  const stage = document.getElementById("stage")?.value || "idea";
  const region = document.getElementById("region")?.value || "";
  const capital = document.getElementById("capital")?.value || 0;

  output.innerHTML = `<div class="card">⏳ Generazione report consulenziale...</div>`;

  try {

    const res = await fetch("/.netlify/functions/businessplan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idea,
        sector,
        stage,
        region,
        capital
      })
    });

    const data = await res.json();

    renderReport(data);

  } catch (err) {

    output.innerHTML = `<div class="card">❌ Errore: ${err.message}</div>`;
  }
}

// =========================
// 🧠 V14 REPORT UI
// =========================

function renderReport(data) {

  const output = document.getElementById("output");
  const ai = data.ai || {};
  const top = data.engine?.top3 || [];

  let html = "";

  // =========================
  // HEADER PRODOTTO
  // =========================

  html += `
    <div class="card">
      <h2>💡 AI Funding Advisor</h2>
      <p><b>Score compatibilità:</b> ${ai.compatibility_score || 0}/100</p>
      <p><b>Probabilità finanziamento:</b> ${ai.probability_financing || 0}%</p>
    </div>
  `;

  // =========================
  // SUMMARY
  // =========================

  html += `
    <div class="card">
      <h3>🧠 Analisi consulenziale</h3>
      <p>${ai.summary || ""}</p>
    </div>
  `;

  // =========================
  // STRENGTHS
  // =========================

  html += `<div class="card"><h3>💪 Perché sei idoneo</h3>`;

  if ((ai.strengths || []).length) {
    html += ai.strengths.map(s => `✔ ${s}`).join("<br>");
  } else {
    html += "✔ Analisi automatica completata";
  }

  html += `</div>`;

  // =========================
  // RISKS
  // =========================

  html += `<div class="card"><h3>⚠️ Criticità</h3>`;

  if ((ai.risks || []).length) {
    html += ai.risks.map(r => `⚠ ${r}`).join("<br>");
  } else {
    html += "⚠ Nessun rischio critico rilevato";
  }

  html += `</div>`;

  // =========================
  // BANDI
  // =========================

  html += `<div class="card"><h3>📊 Bandi compatibili</h3>`;

  top.forEach(b => {
    html += `
      <div style="margin-bottom:10px">
        <b>${b.name}</b><br>
        Score: ${b.score}/100
      </div>
    `;
  });

  html += `</div>`;

  // =========================
  // NEXT STEP
  // =========================

  html += `<div class="card"><h3>🚀 Next step operativo</h3>`;

  if ((ai.recommendations || []).length) {
    html += ai.recommendations.map(r => `✔ ${r}`).join("<br>");
  } else {
    html += "✔ Prepara business plan<br>✔ Verifica requisiti<br>✔ Contatta ente erogatore";
  }

  html += `</div>`;

  // =========================
  // EXPORT MOCK (HTML PDF READY)
  // =========================

  html += `
    <div class="card">
      <button onclick="downloadReport()">📄 Scarica report</button>
    </div>
  `;

  output.innerHTML = html;
}

// =========================
// 📄 EXPORT HTML (MVP PDF)
// =========================

function downloadReport() {

  const content = document.getElementById("output").innerHTML;

  const printWindow = window.open("", "_blank");

  printWindow.document.write(`
    <html>
    <head>
      <title>AI Funding Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 30px;
          color: #111;
        }
        .card {
          border: 1px solid #ddd;
          padding: 15px;
          margin-bottom: 10px;
          border-radius: 8px;
        }
        h2, h3 {
          color: #0f172a;
        }
      </style>
    </head>
    <body>
      ${content}
      <script>
        window.onload = function () {
          window.print();
        }
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
}
