async function generateFunding() {

  const output = document.getElementById("output");

  output.innerHTML = `
    <div class="card">⏳ Analisi AI in corso...</div>
  `;

  const idea = document.getElementById("idea")?.value || "";
  const sector = document.getElementById("sector")?.value || "";
  const stage = document.getElementById("stage")?.value || "idea";
  const region = document.getElementById("region")?.value || "";
  const capital = document.getElementById("capital")?.value || 0;

  try {

    const res = await fetch("/.netlify/functions/businessplan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
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

function render(data) {

  const output = document.getElementById("output");
  const ai = data.ai || {};

  let html = "";

  html += `<h2>🧠 AI Funding Advisor V7</h2>`;

  html += `<div class="card"><b>${ai.summary}</b></div>`;

  html += `<h3>📊 Compatibilità generale</h3>`;
  html += `<div class="card">${ai.compatibility_label}</div>`;

  html += `<h3>📌 Breakdown punteggi</h3>`;

  (ai.breakdown_view || []).forEach(b => {

    html += `
      <div class="card">
        <b>${b.name}</b><br>
        Score: ${b.score}/100<br><br>
        ✔ Settore: ${b.breakdown.sector}<br>
        ✔ Stage: ${b.breakdown.stage}<br>
        ✔ Regione: ${b.breakdown.region}<br>
        ✔ Capitale: ${b.breakdown.capital}
      </div>
    `;

  });

  html += `<h3>🧠 AI Spiegazione</h3>`;

  (ai.ai_explanation || []).forEach(a => {

    html += `
      <div class="card">
        <b>${a.name}</b><br>
        ${a.verdict}<br><br>
        ${ (a.why || []).map(x => "✔ " + x).join("<br>") }
      </div>
    `;

  });

  html += `<h3>🚀 Next Step</h3>`;
  html += `<div class="card">${(ai.next_steps || []).join("<br>")}</div>`;

  output.innerHTML = html;
}
