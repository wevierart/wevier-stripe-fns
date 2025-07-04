// functions/create-paypal-order.js
const fetch = require('node-fetch'); // if you need it

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async (event) => {
  // pre-flight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS };
  }
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...CORS, Allow: 'OPTIONS, POST' },
      body: 'Method Not Allowed'
    };
  }

  let total;
  try {
    ({ total } = JSON.parse(event.body));
    if (!total) throw new Error('Missing total');
  } catch (e) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: e.message })
    };
  }

  const envHost =
    process.env.PAYPAL_ENV === 'production'
      ? 'api-m.paypal.com'
      : 'api-m.sandbox.paypal.com';

  // fetch OAUTH token
  let accessToken;
  try {
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64');

    const tokenRes = await fetch(`https://${envHost}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(JSON.stringify(tokenJson));
    accessToken = tokenJson.access_token;
  } catch (err) {
    console.error('Token error', err);
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: 'Could not fetch PayPal token' })
    };
  }

  // create order
  let orderJson;
  try {
    const orderRes = await fetch(`https://${envHost}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{ amount: { currency_code: 'EUR', value: total.toString() } }]
      })
    });
    orderJson = await orderRes.json();
    if (!orderRes.ok) throw new Error(JSON.stringify(orderJson));
  } catch (err) {
    console.error('Order error', err);
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: 'Could not create PayPal order' })
    };
  }

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({ id: orderJson.id })
  };
};

