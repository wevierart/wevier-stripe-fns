// functions/create-paypal-order.js

const CLIENT_ID     = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// 1) fetch an OAuth token from PayPal
async function getAccessToken() {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res  = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const json = await res.json();
  return json.access_token;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let { amount, currency = 'EUR' } = JSON.parse(event.body);
  if (typeof amount !== 'number' || amount <= 0) {
    return { statusCode: 400, body: 'Invalid amount' };
  }

  try {
    const token = await getAccessToken();

    // 2) create the PayPal order
    const orderRes = await fetch(
      'https://api-m.sandbox.paypal.com/v2/checkout/orders',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: { currency_code: currency, value: amount.toFixed(2) }
          }]
        })
      }
    );
    const order = await orderRes.json();

    // 3) hand the order ID back to the client
    return {
      statusCode: 200,
      body: JSON.stringify({ orderID: order.id }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Server error' };
  }
};
