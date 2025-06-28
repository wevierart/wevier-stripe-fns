const payPal = require('@paypal/paypal-server-sdk');
const env   = process.env; // set PAYPAL_CLIENT_ID & PAYPAL_CLIENT_SECRET in Netlify UI

// helper to make a PayPal client
function client() {
  const envObj = new payPal.core.SandboxEnvironment(
    env.PAYPAL_CLIENT_ID,
    env.PAYPAL_CLIENT_SECRET
  );
  return new payPal.core.PayPalHttpClient(envObj);
}

exports.handler = async (event) => {
  // ───────────────────────────────────────────
  // 1) Handle CORS pre-flight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin'  : '*',
        'Access-Control-Allow-Methods' : 'POST, OPTIONS',
        'Access-Control-Allow-Headers' : 'Content-Type'
      },
      body: ''
    };
  }

  // 2) Only allow POST from here on
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 3) Parse input
  let items, email, subtotal;
  try {
    ({ items, email, subtotal } = JSON.parse(event.body));
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // 4) Build PayPal order
  const request = new payPal.orders.OrdersCreateRequest();
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'EUR',
        value        : subtotal.toFixed(2)
      }
    }],
    application_context: {
      user_action : 'PAY_NOW',
      return_url  : 'https://wevierart.com/success',
      cancel_url  : 'https://wevierart.com/cancel'
    }
  });

  // 5) Execute
  try {
    const response = await client().execute(request);
    return {
      statusCode: 200,
      headers:    { 'Access-Control-Allow-Origin': '*' },
      body:       JSON.stringify({ id: response.result.id })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers:    { 'Access-Control-Allow-Origin': '*' },
      body:        err.toString()
    };
  }
};
