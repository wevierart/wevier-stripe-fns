// functions/create-paypal-order.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const { amount, currency = 'USD', description } = JSON.parse(event.body);

    // Basic auth header
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
    ).toString('base64');

    // Create order on PayPal
    const res = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount.toString(),
          },
          description: description || 'Order'
        }]
      })
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: data })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ id: data.id })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
