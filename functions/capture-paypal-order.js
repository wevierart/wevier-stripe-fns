// functions/capture-paypal-order.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const { orderID } = JSON.parse(event.body);

    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
    ).toString('base64');

    // Capture the order
    const res = await fetch(
      `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        }
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: data })
      };
    }

    // Grab the capture ID out of the response
    const captureID =
      data.purchase_units?.[0]?.payments?.captures?.[0]?.id || null;

    return {
      statusCode: 200,
      body: JSON.stringify({ captureID })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
