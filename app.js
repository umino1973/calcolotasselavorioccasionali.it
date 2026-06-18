let currentUser = null;

// =========================
// 🔐 NETLIFY AUTH SAFE INIT
// =========================

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

  if (!el) return;

  if (currentUser) {
    el.innerHTML = `👤 ${currentUser.email}`;
  } else {
    el.innerHTML = "Non loggato";
  }
}

// =========================
// 🚀 MAIN FUNCTION (NON BLOCCANTE)
// =========================

async function generateFunding() {

  const output = document.getElementById("output");

  const idea = document.getElementById("idea")?.value || "";
  const sector = document.getElementById("sector")?.value || "";
  const stage = document.getElementById("stage")?.value || "idea";
  const region = document.getElementById("region")?.value || "";
  const capital = document.getElementById("capital")?.value || 0;

  // ⚠️ FIX IMPORTANTE: NON BLOCCARE UX
  if (!currentUser) {
    output.innerHTML = `
      <div class="card">
        ⚠️ Non sei loggato<br><br>
        Puoi comunque fare analisi base.
      </div>
    `;
  }

  output.innerHTML = `<div class="card">⏳ Analisi AI in corso...</div>`;

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
        capital,
        user: currentUser?.email || "guest"
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
// 🧠 RENDER (SAFE)
// =========================

function render(data) {

  const output = document.getElementById("output");

  if (!output) return;

  const ai = data.ai || {};

  let html = "";

  html += `<h1>💡 AI Funding Advisor V9</h1>`;

  html += `<div class="card">
    <b>Probabilità finanziamento:</b> ${ai.probability_financing || 0}%
  </div>`;

  html += `<div class="card">
    <b>Score compatibilità:</b> ${ai.compatibility_score || 0}/100
  </div>`;

  html += `<h3>🧠 Analisi</h3>`;
  html += `<div class="card">${ai.summary || ""}</div>`;

  html += `<h3>📊 Bandi</h3>`;

  (ai.breakdown_view || []).forEach(b => {

    html += `
      <div class="card">
        <b>${b.name}</b><br>
        Score: ${b.score}/100
      </div>
    `;
  });

  html += `<h3>👤 Utente</h3>`;
  html += `<div class="card">
    ${data.user || "guest"}
  </div>`;

  output.innerHTML = html;
}
