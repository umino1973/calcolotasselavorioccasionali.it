
async function generateFunding() {

  const output = document.getElementById("output");

  output.innerHTML = `
    <div class="card">⏳ Analisi V10 in corso...</div>
  `;

  const idea = document.getElementById("idea").value;
  const sector = document.getElementById("sector").value;
  const stage = document.getElementById("stage").value;
  const region = document.getElementById("region").value;
  const capital = document.getElementById("capital").value;

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

    render(data);

  } catch (err) {

    output.innerHTML = `
      <div class="card">❌ Errore: ${err.message}</div>
    `;
  }
}


// =========================
// 🎨 V10 RENDER SAFE
// =========================

function render(data) {

  let html = "";

  // =====================
  // 📊 SUMMARY
  // =====================
  html += `<h2>📊 Business Summary</h2>`;
  html += `<div class="card">${data.business_summary}</div>`;

  // =====================
  // 🟢 ELIGIBLE
  // =====================
  html += `<h2>🟢 Bandi Idonei</h2>`;

  (data.eligible || []).forEach(b => {
    html += `
      <div class="card">
        <h3>${b.name}</h3>
        <p><b>${b.entity}</b></p>
        <p>Score: ${b.score}/100</p>
        <p>Probabilità: ${b.probability}</p>

        <p><b>Upgrade:</b> ${(b.upgrade_path || []).join(", ")}</p>

        <a href="${b.link}" target="_blank">Apri bando</a>
      </div>
    `;
  });

  if (!data.eligible || data.eligible.length === 0) {
    html += `<div class="card">Nessun bando pienamente idoneo</div>`;
  }

  // =====================
  // 🟡 PARTIAL
  // =====================
  html += `<h2>🟡 Bandi Parziali</h2>`;

  (data.partial || []).forEach(b => {
    html += `
      <div class="card">
        <h3>${b.name}</h3>
        <p>Score: ${b.score}/100</p>

        <p><b>Mancanze:</b> ${(b.missing || []).join(", ")}</p>

        <p><b>Upgrade:</b> ${(b.upgrade_path || []).join(", ")}</p>
      </div>
    `;
  });

  if (!data.partial || data.partial.length === 0) {
    html += `<div class="card">Nessun bando parzialmente compatibile</div>`;
  }

  // =====================
  // 🔴 EXCLUDED
  // =====================
  html += `<h2>🔴 Esclusi</h2>`;

  (data.excluded || []).forEach(b => {
    html += `
      <div class="card">
        <h3>${b.name}</h3>
        <p>Mancano requisiti per accesso</p>

        <p><b>Mancanze:</b> ${(b.missing || []).join(", ")}</p>
      </div>
    `;
  });

  if (!data.excluded || data.excluded.length === 0) {
    html += `<div class="card">Nessun escluso rilevato</div>`;
  }

  // =====================
  // 💰 FUNDING ESTIMATE
  // =====================
  html += `<h2>💸 Stima Finanziamenti</h2>`;

  html += `
    <div class="card">
      Conservativo: €${data.funding_estimate?.conservative || 0}<br>
      Realistico: €${data.funding_estimate?.realistic || 0}<br>
      Ottimistico: €${data.funding_estimate?.optimistic || 0}
    </div>
  `;

  // =====================
  // 👉 NEXT STEP
  // =====================
  html += `<h2>👉 Prossimo passo</h2>`;
  html += `<div class="card">${data.next_action || "Analisi completata"}</div>`;

  output.innerHTML = html;
}
