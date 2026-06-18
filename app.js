async function generateFunding() {

  const output = document.getElementById("output");

  output.innerHTML = `
    <div class="card">
      ⏳ Analisi opportunità in corso...
    </div>
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

    if (!res.ok) {
      throw new Error("Errore HTTP: " + res.status);
    }

    const data = await res.json();

    render(data);

  } catch (err) {

    output.innerHTML = `
      <div class="card">
        ❌ Errore: ${err.message}
      </div>
    `;
  }
}

function render(data) {

  const output = document.getElementById("output");

  const ai = data.ai || {};

  let html = "";

  html += `<h2>🧠 AI Business Report</h2>`;

  html += `
    <div class="card">
      ${ai.summary || ""}
    </div>
  `;

  html += `
    <h3>📊 Compatibilità</h3>
    <div class="card">
      <strong>${ai.compatibility_label || "N/D"}</strong>
      <br><br>
      Score: ${ai.business_score || 0}/100
    </div>
  `;

  html += `
    <h3>💪 Punti di forza</h3>
    <div class="card">
      ${(ai.strengths || []).join("<br>")}
    </div>
  `;

  html += `
    <h3>⚠️ Rischi</h3>
    <div class="card">
      ${(ai.risks || []).join("<br>")}
    </div>
  `;

  html += `
    <h3>💰 Opportunità individuate</h3>
    <div class="card">
      ${(ai.funding_suggestions || []).join("<br><br>")}
    </div>
  `;

  html += `
    <h3>🚀 Next Step</h3>
    <div class="card">
      ${(ai.next_steps || []).join("<br>")}
    </div>
  `;

  output.innerHTML = html;
}
