// functions/capture-paypal-order.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
  // CORS preflight
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid JSON' })
    };
  }

  const { orderID } = body;
  if (!orderID) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'orderID is required' })
    };
  }

  // 🍸 Get OAuth token again
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const tokenRes = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) {
    console.error('PayPal token error', tokenJson);
    return {
      statusCode: 502,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to get PayPal token' })
    };
  }

  // 🍸 Capture the order
  const captureRes = await fetch(
    `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  const captureJson = await captureRes.json();

  if (!captureJson.id) {
    console.error('PayPal capture error', captureJson);
    return {
      statusCode: 502,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to capture PayPal order', details: captureJson })
    };
  }

  return {
    statusCode: 200,
    headers: { 
      ...corsHeaders,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(captureJson)
  };
};
