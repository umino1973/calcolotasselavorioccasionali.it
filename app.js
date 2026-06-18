
async function generateFunding() {

  const output = document.getElementById("output");

  const idea = document.getElementById("idea")?.value || "";
  const sector = document.getElementById("sector")?.value || "";
  const stage = document.getElementById("stage")?.value || "idea";
  const region = document.getElementById("region")?.value || "";
  const capital = document.getElementById("capital")?.value || 0;

  output.innerHTML = `<div class="card">⏳ Analisi in corso...</div>`;

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
// 🧠 RENDER
// =========================

function renderReport(data) {

  const output = document.getElementById("output");
  const ai = data.ai || {};
  const top3 = data.engine?.top3 || [];

  let html = "";

  html += `
    <div class="card">
      <h2>💡 AI Funding Advisor</h2>
      <p><b>Score compatibilità:</b> ${ai.compatibility_score || 0}/100</p>
      <p><b>Probabilità finanziamento:</b> ${ai.probability_financing || 0}%</p>
      <p>${ai.summary || ""}</p>
    </div>
  `;

  html += `<div class="card"><h3>💪 Punti di forza</h3>`;
  html += (ai.strengths || []).join("<br>") || "✔ Analisi completata";
  html += `</div>`;

  html += `<div class="card"><h3>⚠️ Criticità</h3>`;
  html += (ai.risks || []).join("<br>") || "⚠ Nessuna criticità rilevata";
  html += `</div>`;

  html += `<div class="card"><h3>📊 Bandi compatibili</h3>`;

  top3.forEach(b => {
    html += `<b>${b.name}</b> — ${b.score}/100<br>`;
  });

  html += `</div>`;

  html += `
    <div class="card">
      <h3>🚀 Next step operativo</h3>
      ${(ai.recommendations || []).join("<br>") || "✔ Prepara business plan"}
    </div>
  `;

  html += `
    <div class="card">
      <button onclick="downloadPDF()">📄 Scarica PDF</button>
    </div>
  `;

  output.innerHTML = html;
}

// =========================
// 📄 PDF STABILE (PRINT)
// =========================

function downloadPDF() {
  window.print();
}
