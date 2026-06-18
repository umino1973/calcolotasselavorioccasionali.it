
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
// 🧠 RENDER REPORT
// =========================

function renderReport(data) {

  const output = document.getElementById("output");
  const ai = data.ai || {};
  const top3 = data.engine?.top3 || [];

  let html = "";

  html += `
    <div class="card">
      <h2>💡 AI Funding Advisor</h2>
      <p><b>Score:</b> ${ai.compatibility_score || 0}/100</p>
      <p><b>Probabilità:</b> ${ai.probability_financing || 0}%</p>
      <p>${ai.summary || ""}</p>
    </div>
  `;

  html += `<div class="card"><h3>💪 Punti di forza</h3>`;
  html += (ai.strengths || []).join("<br>") || "Nessuno";
  html += `</div>`;

  html += `<div class="card"><h3>⚠️ Rischi</h3>`;
  html += (ai.risks || []).join("<br>") || "Nessuno";
  html += `</div>`;

  html += `<div class="card"><h3>📊 Bandi</h3>`;

  top3.forEach(b => {
    html += `<b>${b.name}</b> — ${b.score}/100<br>`;
  });

  html += `</div>`;

  html += `
    <div class="card">
      <h3>🚀 Next step</h3>
      ${(ai.recommendations || []).join("<br>")}
    </div>
  `;

  // =========================
  // 🔥 ACTION BUTTONS
  // =========================

  html += `
    <div class="card">

      <button onclick="saveReport()">💾 Salva report</button>
      <button onclick="downloadPDF()">📄 Scarica PDF</button>

      <button onclick="shareReport()">🔗 Genera link condivisibile</button>

      <div id="shareBox" style="margin-top:10px;"></div>

    </div>
  `;

  output.innerHTML = html;
}

// =========================
// 💾 SAVE REPORT (Netlify)
// =========================

async function saveReport() {

  const report = document.getElementById("output").innerHTML;

  const res = await fetch("/.netlify/functions/saveReport", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ report })
  });

  const data = await res.json();

  window.lastReportId = data.id;

  alert("Report salvato!");
}

// =========================
// 🔗 SHARE LINK
// =========================

function shareReport() {

  if (!window.lastReportId) {
    alert("Prima salva il report");
    return;
  }

  const link = `${window.location.origin}/?report=${window.lastReportId}`;

  document.getElementById("shareBox").innerHTML =
    `<input style="width:100%" value="${link}" readonly onclick="this.select()">`;
}

// =========================
// 📄 PDF (PRINT MODE)
// =========================

function downloadPDF() {
  window.print();
}
