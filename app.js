async function generateFunding() {

  const output = document.getElementById("output");

  output.innerHTML = `<div class="card">⏳ Analisi AI in corso...</div>`;

  const idea = document.getElementById("idea")?.value || "";
  const sector = document.getElementById("sector")?.value || "";
  const stage = document.getElementById("stage")?.value || "idea";
  const region = document.getElementById("region")?.value || "";
  const capital = document.getElementById("capital")?.value || 0;

  try {

    const res = await fetch("/.netlify/functions/businessplan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea, sector, stage, region, capital })
    });

    const data = await res.json();

    // 💾 SALVATAGGIO STORICO (V8 SaaS FEATURE)
    const history = JSON.parse(localStorage.getItem("ai_history") || "[]");

    history.unshift({
      idea,
      sector,
      region,
      result: data,
      date: new Date().toISOString()
    });

    localStorage.setItem("ai_history", JSON.stringify(history.slice(0, 10)));

    render(data, history);

  } catch (err) {

    output.innerHTML = `<div class="card">❌ Errore: ${err.message}</div>`;
  }
}

// =========================
// 🧠 RENDER V8
// =========================

function render(data, history) {

  const output = document.getElementById("output");
  const ai = data.ai || {};

  let html = "";

  html += `<h1>💡 AI Funding Advisor V8</h1>`;

  html += `<div class="card">
    <b>Probabilità finanziamento:</b> ${ai.probability_financing || 0}%
  </div>`;

  html += `<div class="card">
    <b>Score compatibilità:</b> ${ai.compatibility_score || 0}/100
  </div>`;

  html += `<h3>🧠 Analisi AI</h3>`;
  html += `<div class="card">${ai.summary || ""}</div>`;

  html += `<h3>📊 Top bandi</h3>`;

  (ai.breakdown_view || []).forEach(b => {

    html += `
      <div class="card">
        <b>${b.name}</b><br>
        Score: ${b.score}/100
      </div>
    `;

  });

  html += `<h3>📜 Storico (locale)</h3>`;

  (history || []).slice(0, 5).forEach(h => {

    html += `
      <div class="card">
        ${h.idea}<br>
        <small>${new Date(h.date).toLocaleString()}</small>
      </div>
    `;

  });

  output.innerHTML = html;
}
