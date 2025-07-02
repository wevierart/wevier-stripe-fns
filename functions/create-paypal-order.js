exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { amount, currency, description } = JSON.parse(event.body);

  const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
  const PAYPAL_SECRET    = process.env.PAYPAL_SECRET;
  const basicAuth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`)
                         .toString("base64");

  // 1) get an access token
  const tokenRes = await fetch(
    "https://api-m.sandbox.paypal.com/v1/oauth2/token",
    {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type":  "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    }
  );
  const { access_token } = await tokenRes.json();

  // 2) create the order
  const orderRes = await fetch(
    "https://api-m.sandbox.paypal.com/v2/checkout/orders",
    {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${access_token}`
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: {
            currency_code: currency,
            value:           amount.toString()
          },
          description
        }]
      })
    }
  );

  const orderData = await orderRes.json();
  if (orderData.id) {
    return {
      statusCode: 200,
      body:       JSON.stringify({ id: orderData.id })
    };
  } else {
    return {
      statusCode: 500,
      body:       JSON.stringify(orderData)
    };
  }
};
