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
    statusCode: 500,
    body: JSON.stringify({
      error: data,
      debug: true
    })
  };
}

return {
  statusCode: 200,
  body: JSON.stringify({
    result: data.choices?.[0]?.message?.content
  })
};
