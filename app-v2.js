async function generateFunding() {

  const output = document.getElementById("output");

  // ⏳ LOADING STATE
  output.innerHTML = `
    <div class="card">
      ⏳ Analisi in corso...<br>
      <small>Valutazione bandi e probabilità di finanziamento</small>
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

    render(data);

  } catch (err) {
    output.innerHTML = `
      <div class="card">
        ❌ Errore: ${err.message}
      </div>
    `;
  }
}


// =====================
// 🎨 RENDER V8.1
// =====================
function render(data) {

  const output = document.getElementById("output");

  let html = "";

  html += `<h2>📊 Business Summary</h2>`;
  html += `<div class="card">${data.business_summary}</div>`;

  html += `<h2>💰 Bandi disponibili</h2>`;

  if (data.funding_opportunities?.length) {

    data.funding_opportunities.forEach(b => {
      html += `
        <div class="card">
          <h3>${b.name}</h3>
          <p><b>${b.entity}</b></p>
          <p>Score: ${b.score}/100</p>
          <p>Probabilità: ${b.probability}</p>
          <p>${b.reason}</p>
          <a href="${b.link}" target="_blank">Apri bando</a>
        </div>
      `;
    });

  } else {
    html += `<div class="card">Nessun bando compatibile</div>`;
  }

  html += `<h2>💸 Stima finanziamenti</h2>`;
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
