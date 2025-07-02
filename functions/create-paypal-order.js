// functions/create-paypal-order.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
  // CORS preflight support
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

  // Compute your order total however you like
  const total = (body.items || []).reduce((sum, i) => sum + (i.unit_price * i.quantity), 0);

  // 🍸 Get an OAuth token from PayPal
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

  // 🍸 Create the order
  const orderRes = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenJson.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'EUR',
            value: total.toFixed(2)
          }
        }
      ]
    })
  });
  const orderJson = await orderRes.json();

  if (!orderJson.id) {
    console.error('PayPal create order error', orderJson);
    return {
      statusCode: 502,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to create PayPal order', details: orderJson })
    };
  }

  return {
    statusCode: 200,
    headers: { 
      ...corsHeaders,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderJson)
  };
};
