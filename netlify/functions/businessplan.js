exports.handler = async (event) => {
  try {

    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body || "{}");

    const { idea, sector, stage, region, capital } = body;

    const apiKey = process.env.OPENAI_API_KEY;

    const prompt = `
SEI UN FUNDING INTELLIGENCE ENGINE.

OUTPUT SOLO JSON VALIDO.

IDEA:
${idea}

SETTORE:
${sector}

STAGE:
${stage}

REGIONE:
${region}

CAPITALE:
${capital}

REGOLE:
- usa solo bandi reali UE/Italia
- se non ci sono bandi → fallback finanziario
- NON inventare numeri falsi

OUTPUT:

{
  "business_summary": "",
  "funding_opportunities": [
    {
      "name": "",
      "entity": "",
      "link": "",
      "compatibility_score": 0,
      "success_probability": "low|medium|high",
      "reason": ""
    }
  ],
  "funding_estimate": {
    "conservative": 0,
    "realistic": 0,
    "optimistic": 0
  },
  "overall_score": 0,
  "next_action": ""
}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Sei un incubatore finanziario europeo specializzato in funding startup." },
          { role: "user", content: prompt }
        ],
        temperature: 0.4
      })
    });

    const data = await response.json();

    const result = data?.choices?.[0]?.message?.content;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ result })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
