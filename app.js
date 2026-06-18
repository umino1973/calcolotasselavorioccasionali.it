// =========================
// 🔐 AUTH NETLIFY IDENTITY
// =========================

let currentUser = null;

if (window.netlifyIdentity) {

  window.netlifyIdentity.on("init", user => {
    currentUser = user;
    updateUserUI();
  });

  window.netlifyIdentity.on("login", user => {
    currentUser = user;
    updateUserUI();
    window.netlifyIdentity.close();
  });

  window.netlifyIdentity.on("logout", () => {
    currentUser = null;
    updateUserUI();
  });

  window.netlifyIdentity.init();
}

function login() {
  window.netlifyIdentity.open();
}

function logout() {
  window.netlifyIdentity.logout();
}

function updateUserUI() {
  const el = document.getElementById("userInfo");

  if (currentUser) {
    el.innerHTML = `👤 ${currentUser.email}`;
  } else {
    el.innerHTML = "Non loggato";
  }
}

// =========================
// 🚀 MAIN CALL
// =========================

async function generateFunding() {

  if (!currentUser) {
    alert("Devi fare login");
    return;
  }

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
      headers: {
        "Content-Type": "application/json",
        "Authorization": currentUser.token.access_token
      },
      body: JSON.stringify({
        idea,
        sector,
        stage,
        region,
        capital,
        user: currentUser.email
      })
    });

    const data = await res.json();

    render(data);

  } catch (err) {

    output.innerHTML = `<div class="card">❌ Errore: ${err.message}</div>`;
  }
}

// =========================
// 🧠 RENDER
// =========================

function render(data) {

  const output = document.getElementById("output");
  const ai = data.ai || {};

  let html = "";

  html += `<h1>💡 AI Funding Advisor V9</h1>`;

  html += `<div class="card">
    <b>Probabilità finanziamento:</b> ${ai.probability_financing || 0}%
  </div>`;

  html += `<div class="card">
    <b>Score:</b> ${ai.compatibility_score || 0}/100
  </div>`;

  html += `<h3>🧠 Analisi AI</h3>`;
  html += `<div class="card">${ai.summary || ""}</div>`;

  html += `<h3>📊 Bandi</h3>`;

  (ai.breakdown_view || []).forEach(b => {

    html += `
      <div class="card">
        <b>${b.name}</b><br>
        Score: ${b.score}
      </div>
    `;

  });

  html += `<h3>📜 Storico cloud</h3>`;
  html += `<div class="card">Salvataggio attivo per utente loggato</div>`;

  output.innerHTML = html;
}
