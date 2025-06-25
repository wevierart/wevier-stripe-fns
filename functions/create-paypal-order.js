// functions/create-paypal-order.js
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

// 1) configure environment
const env = new checkoutNodeJssdk.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_SECRET
);
const client = new checkoutNodeJssdk.core.PayPalHttpClient(env);

exports.handler = async (event) => {
  // allow only POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let { amount } = JSON.parse(event.body);
  if (!amount) {
    return { statusCode: 400, body: 'Missing amount' };
  }

  // 2) build the order request
  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'EUR',
        value: amount.toString()
      }
    }]
  });

  try {
    // 3) call PayPal
    const response = await client.execute(request);
    return {
      statusCode: 200,
      body: JSON.stringify({ orderID: response.result.id })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: err.toString() };
  }
};
