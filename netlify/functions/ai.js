exports.handler = async (event) => {
  try {
    // 🔒 Solo POST
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" })
      };
    }

    // 📦 Parse body
    let body;
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid JSON body" })
      };
    }

    const idea = body.idea;

    if (!idea || typeof idea !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing idea" })
      };
    }

    // 🔑 API KEY
    const apiKey = process.env.OPENAI_API_KEY;

    console.log("OPENAI KEY STATUS:", apiKey ? "LOADED" : "MISSING");

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "OPENAI_API_KEY not loaded in environment variables"
        })
      };
    }

    // 🤖 CHIAMATA OPENAI
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
            content: "Sei TaxCopilot. Analizzi idee imprenditoriali e suggerisci opportunità fiscali e business in modo chiaro in italiano."
          },
          {
            role: "user",
            content: idea
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    // ❌ Errore OpenAI
    if (!response.ok) {
      console.log("OpenAI ERROR:", data);

      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: "OpenAI API error",
          details: data
        })
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

    // ✅ SUCCESSO
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
    console.log("FUNCTION ERROR:", err);

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
