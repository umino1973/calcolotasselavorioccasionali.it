exports.handler = async () => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      ai: {
        summary: "Test OK",
        strengths: ["Backend funzionante"],
        risks: [],
        business_score: 100,
        funding_suggestions: ["Test"],
        next_steps: ["Test"]
      },
      debug: {
        status: "ok"
      }
    })
  };
};
