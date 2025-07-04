// functions/create-paypal-order.js

// If you want to use a local .env during dev uncomment next line
// require('dotenv').config();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',            // or your exact domain
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async (event, context) => {
  // 1) CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  // 2) Only POST is allowed for order creation
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 
        ...CORS_HEADERS,
        Allow: 'OPTIONS, POST'
      },
      body: 'Method Not Allowed'
    };
  }

  // 3) Parse the incoming order payload
  let { total } = {};
  try {
    const data = JSON.parse(event.body);
    total = data.total;
    if (!total) throw new Error('Missing `total` in request body');
  } catch (err) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message })
    };
  }

  // 4) Determine PayPal API base (sandbox vs production)
  const env = process.env.PAYPAL_ENV === 'production' ? 'api-m.paypal.com' : 'api-m.sandbox.paypal.com';
  const baseURL = `https://${env}`;

  // 5) Fetch an OAuth token from PayPal
  let accessToken;
  try {
    const creds = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64');

    const authRes = await fetch(`${baseURL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    const authJson = await authRes.json();
    if (!authRes.ok) {
      throw new Error(`Token error: ${JSON.stringify(authJson)}`);
    }
    accessToken = authJson.access_token;
  } catch (err) {
    console.error('PayPal token fetch failed:', err);
    return {
      statusCode: 502,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Failed to fetch PayPal token' })
    };
  }

  // 6) Create the order
  let order;
  try {
    const orderRes = await fetch(`${baseURL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'EUR',
            value: total.toString()
          }
        }]
      })
    });
    const orderJson = await orderRes.json();
    if (!orderRes.ok) {
      throw new Error(`Order creation failed: ${JSON.stringify(orderJson)}`);
    }
    order = orderJson;
  } catch (err) {
    console.error('PayPal order creation failed:', err);
    return {
      statusCode: 502,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Failed to create PayPal order' })
    };
  }

  // 7) Return the new order ID
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ id: order.id })
  };
};
