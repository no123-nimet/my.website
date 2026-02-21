exports.handler = async function (event, context) {
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Products`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch products" })
    };
  }
};
