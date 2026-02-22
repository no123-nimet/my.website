exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;

  try {
    const { orderNumber, email, reason } = JSON.parse(event.body);

    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Returns`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fields: {
            "Order ID": orderNumber,
            "Email": email,
            "Reason": reason,
            "Status": "Pending",
            "Date": new Date().toISOString().split('T')[0]
          }
        })
      }
    );

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to submit return" })
    };
  }
};
