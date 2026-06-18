
async function generateFunding() {

  const output = document.getElementById("output");

  const idea = document.getElementById("idea")?.value || "";
  const sector = document.getElementById("sector")?.value || "";
  const stage = document.getElementById("stage")?.value || "idea";
  const region = document.getElementById("region")?.value || "";
  const capital = document.getElementById("capital")?.value || 0;

  output.innerHTML = `
    <div class="card">⏳ Analisi AI in corso...</div>
  `;

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

// =========================
// 🧠 RENDER STABILE V8
// =========================

function render(data) {

  const output = document.getElementById("output");

  const ai = data.ai || {};

  let html = "";

  html += `<h1>💡 AI Funding Advisor</h1>`;

  html += `<div class="card">
    <b>Probabilità finanziamento:</b> ${ai.probability_financing || 0}%
  </div>`;

  html += `<div class="card">
    <b>Score compatibilità:</b> ${ai.compatibility_score || 0}/100
  </div>`;

  html += `<h3>🧠 Analisi</h3>`;
  html += `<div class="card">${ai.summary || "Nessuna analisi disponibile"}</div>`;

  html += `<h3>📊 Bandi rilevanti</h3>`;

  if (Array.isArray(ai.breakdown_view)) {

    ai.breakdown_view.forEach(b => {

      html += `
        <div class="card">
          <b>${b.name}</b><br>
          Score: ${b.score}/100
        </div>
      `;

    });

  } else {

    html += `<div class="card">Nessun bando trovato</div>`;
  }

  html += `<h3>🚀 Next Step</h3>`;

  const steps = ai.next_steps;

  if (Array.isArray(steps) && steps.length > 0) {

    html += `<div class="card">
      ${steps.map(s => `✔ ${s}`).join("<br>")}
    </div>`;

  } else {

    html += `<div class="card">
      ✔ Validare idea<br>
      ✔ Analizzare mercato<br>
      ✔ Preparare business plan
    </div>`;

  }

  output.innerHTML = html;
}
