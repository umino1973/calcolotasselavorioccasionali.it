const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {

  try {

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: "Method Not Allowed"
      };
    }

    const body = JSON.parse(event.body || "{}");

    const report = body.report;

    if (!report) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No report" })
      };
    }

    const id = Date.now().toString();

    const filePath = path.join(process.cwd(), "data", "reports.json");

    let db = [];

    try {
      db = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (e) {
      db = [];
    }

    db.push({
      id,
      createdAt: new Date().toISOString(),
      report
    });

    fs.writeFileSync(filePath, JSON.stringify(db, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({ id })
    };

  } catch (err) {

    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
