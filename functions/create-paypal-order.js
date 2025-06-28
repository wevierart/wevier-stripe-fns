// functions/create-paypal-order.js
const payPal = require('@paypal/paypal-server-sdk');
const env   = process.env;  // Set PAYPAL_CLIENT_ID & SECRET in Netlify UI

function client() {
  const envObj = new payPal.core.SandboxEnvironment(
    env.PAYPAL_CLIENT_ID,
    env.PAYPAL_CLIENT_SECRET
  );
  return new payPal.core.PayPalHttpClient(envObj);
}

exports.handler = async (event) => {
  const { items, email, subtotal } = JSON.parse(event.body);

  const request = new payPal.orders.OrdersCreateRequest();
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'EUR',
        value: subtotal.toFixed(2)
      }
    }],
    application_context: {
      user_action: 'PAY_NOW',
      return_url: 'https://yourdomain.com/success',
      cancel_url: 'https://yourdomain.com/cancel'
    }
  });

  try {
    const response = await client().execute(request);
    return {
      statusCode: 200,
      body: JSON.stringify({ id: response.result.id })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: err.toString() };
  }
};
