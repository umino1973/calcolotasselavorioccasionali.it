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
  const errText = await res.text();
  throw new Error(errText);
}

const data = await res.json();
