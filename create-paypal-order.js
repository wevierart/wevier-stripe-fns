// netlify/functions/create-paypal-order.js
const paypal = require('@paypal/checkout-server-sdk');
const env    = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(env);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const { items } = JSON.parse(event.body);
  const total = items
    .reduce((sum,i)=>sum + (i.price * i.quantity), 0)
    .toFixed(2);

  const request = new paypal.orders.OrdersCreateRequest();
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'EUR',
        value: total
      }
    }]
  });

  try {
    const order = await client.execute(request);
    return {
      statusCode: 200,
      body: JSON.stringify({ orderID: order.result.id })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify(err) };
  }
}
