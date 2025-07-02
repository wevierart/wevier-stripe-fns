const fetch = require('node-fetch');

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { orderID } = JSON.parse(event.body);

  const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
  const PAYPAL_SECRET = process.env.PAYPAL_SECRET;

  // Get access token
  const basicAuth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  const tokenResponse = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // Capture order
  const captureRes = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    }
  });

  const captureData = await captureRes.json();

  if (captureData.status === "COMPLETED") {
    return {
      statusCode: 200,
      body: JSON.stringify({ status: "COMPLETED", details: captureData })
    };
  } else {
    return {
      statusCode: 500,
      body: JSON.stringify(captureData)
    };
  }
};
