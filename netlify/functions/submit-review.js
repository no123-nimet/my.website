exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;

  try {
    const { name, product, rating, review } = JSON.parse(event.body);

    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Reviews`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fields: {
            "Customer Name": name,
            "Product": product,
            "Rating": parseInt(rating),
            "Review Message": review,
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
      body: JSON.stringify({ error: "Failed to submit review" })
    };
  }
};
