async function run() {

  const output = document.getElementById("output");

  output.innerHTML = "<div class='card'>⏳ Analisi in corso...</div>";

  const res = await fetch("/.netlify/functions/businessplan", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      idea: idea.value,
      sector: sector.value,
      stage: stage.value,
      region: region.value,
      capital: capital.value
    })
  });

  const data = await res.json();

  let html = "";

  html += `<div class="card">`;
  html += `<h2>🧠 Risultato</h2>`;
  html += `<p>${data.summary.interpretation}</p>`;
  html += `</div>`;

  html += `<div class="card">`;
  html += `<h3>🏆 Miglior bando</h3>`;
  html += `<p>${data.best_match.name} - ${data.best_match.score}/100</p>`;
  html += `</div>`;

  html += `<div class="card">`;
  html += `<h3>👉 Prossimo step</h3>`;
  html += `<p>${data.next_step}</p>`;
  html += `</div>`;

  output.innerHTML = html;
}
