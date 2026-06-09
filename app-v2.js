async function generateFunding() {

  const output = document.getElementById("output");

  output.innerHTML = `
    <div class="card">⏳ Analisi V9 in corso...</div>
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
      body: JSON.stringify({ idea, sector, stage, region, capital })
    });

    const data = await res.json();

    render(data);

  } catch (err) {
    output.innerHTML = `<div class="card">❌ ${err.message}</div>`;
  }
}


// =========================
// 🎨 V9 RENDER (3 COLONNE LOGICHE)
// =========================

function render(data) {

  let html = "";

  html += `<h2>📊 Business Summary</h2>`;
  html += `<div class="card">${data.business_summary}</div>`;

  // =====================
  // 🟢 ELIGIBLE
  // =====================
  html += `<h2>🟢 Bandi Idonei</h2>`;

  if (data.eligible?.length) {
    data.eligible.forEach(b => {
      html += `
        <div class="card">
          <h3>${b.name}</h3>
          <p><b>${b.entity}</b></p>
          <p>Score: ${b.score}/100</p>
          <p>Probabilità: ${b.probability}</p>
          <p>${b.reasons.join(", ")}</p>
          <a href="${b.link}" target="_blank">Apri bando</a>
        </div>
      `;
    });
  } else {
    html += `<div class="card">Nessun bando pienamente idoneo</div>`;
  }

  // =====================
  // 🟡 PARTIAL
  // =====================
  html += `<h2>🟡 Bandi Parzialmente Compatibili</h2>`;

  data.partial?.forEach(b => {
    html += `
      <div class="card">
        <h3>${b.name}</h3>
        <p>Score: ${b.score}/100</p>
        <p>${b.reasons.join(", ")}</p>
      </div>
    `;
  });

  // =====================
  // 🔴 EXCLUDED
  // =====================
  html += `<h2>🔴 Non Idonei</h2>`;

  data.excluded?.forEach(b => {
    html += `
      <div class="card">
        <h3>${b.name}</h3>
        <p>${b.reasons.join(", ")}</p>
      </div>
    `;
  });

  // =====================
  // 💰 FINANZIAMENTO
  // =====================
  html += `<h2>💸 Stima Finanziamenti</h2>`;
  html += `
    <div class="card">
      Conservativo: €${data.funding_estimate.conservative}<br>
      Realistico: €${data.funding_estimate.realistic}<br>
      Ottimistico: €${data.funding_estimate.optimistic}
    </div>
  `;

  html += `<h2>👉 Prossimo passo</h2>`;
  html += `<div class="card">${data.next_action}</div>`;

  output.innerHTML = html;
}
