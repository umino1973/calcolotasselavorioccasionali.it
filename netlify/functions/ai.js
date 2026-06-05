const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
  },
  body: JSON.stringify({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Sei TaxCopilot. Rispondi in italiano in modo strutturato."
      },
      {
        role: "user",
        content: idea
      }
    ]
  })
});

const data = await response.json();

// 🔴 DEBUG IMPORTANTE
if (!response.ok) {
 return {
  statusCode: 200,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  },
  body: JSON.stringify({
    result: data.choices?.[0]?.message?.content || "Nessuna risposta"
  })
};
return {
  statusCode: 200,
  body: JSON.stringify({
    result: data.choices?.[0]?.message?.content
  })
};
