async function generateFunding() {

  const output = document.getElementById("output");

  if (!output) {
    alert("Output non trovato nel DOM");
    return;
  }

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
      body: JSON.stringify({
        idea,
        sector,
        stage,
        region,
        capital
      })
    });

    if (!res.ok) {
      throw new Error("Errore HTTP: " + res.status);
    }

    const data = await res.json();

    render(data);

  } catch (err) {

    output.innerHTML = `
      <div class="card">❌ Errore: ${err.message}</div>
    `;
  }
}


// =========================
// 🧠 RENDER
// =========================

function render(data) {

  const output = document.getElementById("output");

  const ai = data.ai || {};

  let html = "";

  html += `<h2>🧠 AI Business Report</h2>`;
  html += `<div class="card">${ai.summary || "Nessuna analisi"}</div>`;

  html += `<h3>💪 Punti di forza</h3>`;
  html += `<div class="card">${(ai.strengths || []).join("<br>")}</div>`;

  html += `<h3>⚠️ Rischi</h3>`;
  html += `<div class="card">${(ai.risks || []).join("<br>")}</div>`;

  html += `<h3>📊 Score</h3>`;
  html += `<div class="card">${ai.business_score || 0}/100</div>`;

  html += `<h3>💰 Finanziamenti</h3>`;
  html += `<div class="card">${(ai.funding_suggestions || []).join("<br>")}</div>`;

  html += `<h3>🚀 Next step</h3>`;
  html += `<div class="card">${(ai.next_steps || []).join("<br>")}</div>`;

  html += `<h3>🧪 Debug</h3>`;
  html += `<pre>${JSON.stringify(data.debug, null, 2)}</pre>`;

  output.innerHTML = html;
}
