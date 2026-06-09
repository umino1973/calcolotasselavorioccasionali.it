async function generateFunding() {

  const idea = document.getElementById("idea").value;
  const sector = document.getElementById("sector").value;
  const stage = document.getElementById("stage").value;
  const region = document.getElementById("region").value;
  const capital = document.getElementById("capital").value;

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

  const parsed = JSON.parse(data.result);

  render(parsed);
}

function render(data) {

  let html = "";

  html += `<h2>📊 Business Summary</h2>`;
  html += `<div class="card">${data.business_summary}</div>`;

  html += `<h2>💰 Bandi disponibili</h2>`;

  if (data.funding_opportunities.length > 0) {

    data.funding_opportunities.forEach(b => {
      html += `
        <div class="card">
          <h3>${b.name}</h3>
          <p><span class="badge">${b.compatibility_score}% match</span></p>
          <p>Ente: ${b.entity}</p>
          <p>Probabilità: ${b.success_probability}</p>
          <p>${b.reason}</p>
          <a href="${b.link}" target="_blank" style="color:#38bdf8">Apri bando</a>
        </div>
      `;
    });

  } else {
    html += `<p>Nessun bando diretto trovato.</p>`;
  }

  html += `<h2>💸 Stima finanziamenti</h2>`;
  html += `<div class="card">
    Conservativo: €${data.funding_estimate.conservative}<br>
    Realistico: €${data.funding_estimate.realistic}<br>
    Ottimistico: €${data.funding_estimate.optimistic}
  </div>`;

  html += `<h2>📈 Score: ${data.overall_score}/100</h2>`;

  html += `<h2>👉 Prossimo passo</h2>`;
  html += `<div class="card">${data.next_action}</div>`;

  document.getElementById("output").innerHTML = html;
}
