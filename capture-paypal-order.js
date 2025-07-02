// netlify/functions/capture-paypal-order.js
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
  const { orderID } = JSON.parse(event.body);
  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  try {
    const capture = await client.execute(request);
    return {
      statusCode: 200,
      body: JSON.stringify(capture.result)
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify(err) };
  }
}
