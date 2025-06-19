// functions/create-checkout-session.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// during dev you can use "*" but in prod lock it to your Webflow domain
const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "https://www.wevierart.com",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
  "Access-Control-Allow-Headers": "Content-Type",
};

exports.handler = async (event) => {
  // 1) preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  // 2) only POSTs allowed
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: "Method Not Allowed",
    };
  }

  // 3) parse JSON
  let data;
  try {
    data = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, headers: CORS_HEADERS, body: "Invalid JSON" };
  }

  const { email, shipping, currency, items } = data;

  try {
    // a) create the customer (with shipping)
    const customer = await stripe.customers.create({
      email,
      shipping: {
        name: shipping.name,
        address: {
          line1:       shipping.address,
          line2:       shipping.address2,
          city:        shipping.city,
          state:       shipping.state,
          postal_code: shipping.zip,
          country:     shipping.country,
        },
      },
    });

    // b) build the line_items
    const line_items = items.map((it) => ({
      price_data: {
        currency,
        unit_amount: it.price,  // already in cents on your front‐end
        product_data: {
          name:        it.name,
          description: it.description,
          images:      [ it.image ],
        },
      },
      quantity: it.quantity,
    }));

    // c) create the Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer:            customer.id,
      payment_method_types:["card"],
      mode:                "payment",
      line_items,
      success_url:         `https://www.wevierart.com/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:          `https://www.wevierart.com/checkout-canceled`,
    });

    return {
      statusCode: 200,
      headers:   CORS_HEADERS,
      body:      JSON.stringify({ sessionId: session.id }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers:   CORS_HEADERS,
      body:      JSON.stringify({ error: err.message }),
    };
  }
};
