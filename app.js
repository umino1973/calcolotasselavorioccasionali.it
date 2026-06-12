console.log("APP JS CARICATO");

async function run() {

  console.log("RUN ATTIVATO");

  const output = document.getElementById("output");

  if (!output) {
    alert("Output non trovato");
    return;
  }

  output.innerHTML = "<div class='card'>⏳ Analisi AI in corso...</div>";

  const idea = document.getElementById("idea").value;
  const sector = document.getElementById("sector").value;
  const stage = document.getElementById("stage").value;
  const region = document.getElementById("region").value;
  const capital = document.getElementById("capital").value;

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

    console.log("STATUS:", res.status);

    const text = await res.text();
    console.log("RAW RESPONSE:", text);

    let data;

    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("Risposta non JSON: " + text);
    }

    let html = "";

    html += `<div class="card">
      <h2>🏆 Miglior bando</h2>
      <p>${data.best_match?.name || "Nessun dato"}</p>
      <p>Score: ${data.best_match?.score || 0}</p>
    </div>`;

    html += `<div class="card">
      <h3>Debug</h3>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    </div>`;

    output.innerHTML = html;

  } catch (err) {

    console.error(err);

    output.innerHTML = `<div class="card">❌ Errore: ${err.message}</div>`;
  }
}
