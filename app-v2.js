async function generateFunding() {

  const output = document.getElementById("output");

  // 🟡 LOADING STATE (OBBLIGATORIO)
  output.innerHTML = `
    <div class="card">
      ⏳ Sto analizzando la tua idea...<br>
      <small>Ricerca bandi e calcolo finanziamenti in corso</small>
    </div>
  `;

  const idea = document.getElementById("idea").value;
  const sector = document.getElementById("sector").value;
  const stage = document.getElementById("stage").value;
  const region = document.getElementById("region").value;
  const capital = document.getElementById("capital").value;

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

    console.log("RAW RESPONSE:", data);

    if (!data) {
      output.innerHTML = "❌ Nessuna risposta dal server";
      return;
    }

    let parsed = data;

    // 🛡️ fallback sicurezza JSON
    if (typeof data.result === "string") {
      try {
        parsed = JSON.parse(data.result);
      } catch (e) {
        parsed = data;
      }
    }

    render(parsed);

  } catch (err) {
    output.innerHTML = `
      <div class="card">
        ❌ Errore: ${err.message}
      </div>
    `;
  }
}


// =====================
// 🎨 RENDER UI V6
// =====================
function render(data) {

  let html = "";

  html += `<h2>📊 Business Summary</h2>`;
  html += `<div class="card">${data.business_summary || "N/A"}</div>`;

  html += `<h2>💰 Bandi disponibili</h2>`;

  if (data.funding_opportunities && data.funding_opportunities.length > 0) {

    data.funding_opportunities.forEach(b => {
      html += `
        <div class="card">
          <h3>${b.name}</h3>
          <p><b>${b.entity}</b></p>
          <p>Score: ${b.compatibility_score}%</p>
          <p>Probabilità: ${b.success_probability}</p>
          <p>${b.reason || ""}</p>
          <a href="${b.link}" target="_blank" style="color:#38bdf8">
            Apri bando
          </a>
        </div>
      `;
    });

  } else {
    html += `<div class="card">Nessun bando diretto trovato</div>`;
  }

  html += `<h2>💸 Stima finanziamenti</h2>`;
  html += `
    <div class="card">
      Conservativo: €${data.funding_estimate?.conservative || 0}<br>
      Realistico: €${data.funding_estimate?.realistic || 0}<br>
      Ottimistico: €${data.funding_estimate?.optimistic || 0}
    </div>
  `;

  html += `<h2>📈 Score</h2>`;
  html += `<div class="card">${data.overall_score || 0}/100</div>`;

  html += `<h2>👉 Prossimo passo</h2>`;
  html += `<div class="card">${data.next_action || ""}</div>`;

  output.innerHTML = html;
}
