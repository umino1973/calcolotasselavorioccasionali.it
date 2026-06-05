exports.handler = async (event) => {
  try {

    // Consenti solo POST
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" })
      };
    }

    // Parse body in sicurezza
    const body = event.body ? JSON.parse(event.body) : {};
    const idea = body.idea || "";

    if (!idea) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing idea" })
      };
    }

    // Chiamata OpenAI
const apiKey = process.env.OPENAI_API_KEY;

console.log("KEY START:", process.env.OPENAI_API_KEY?.slice(0, 8));

if (!apiKey) {
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: "Missing OPENAI_API_KEY in environment variables"
    })
  };
}

if (!apiKey) {
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: "Missing OPENAI_API_KEY in environment variables"
    })
  };
}

const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Sei TaxCopilot. Analizzi idee e trovi opportunità fiscali in italiano."
      },
      {
        role: "user",
        content: idea
      }
    ]
  })
});

    const data = await response.json();

    // Debug errore OpenAI vero (fondamentale)
    if (!response.ok) {
  return {
    statusCode: 500,
    body: JSON.stringify(data)
  };
}

    const result = data?.choices?.[0]?.message?.content;

    if (!result) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Empty response from OpenAI",
          raw: data
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        result
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        error: err.message
      })
    };
  }
};
