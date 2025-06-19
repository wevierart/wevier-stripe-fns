// functions/create-checkout-session.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// allow your Webflow domain (or use "*" during dev)
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://www.wevierart.com",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
  "Access-Control-Allow-Headers": "Content-Type",
};

exports.handler = async (event) => {
  // 1) CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  // 2) Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: "Method Not Allowed",
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: "Invalid JSON",
    };
  }

  const { items, shipping, currency, email } = body;

  try {
    // (a) create a Stripe customer with shipping
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

    // (b) build your line items
    const line_items = items.map((i) => ({
      price_data: {
        currency,
        unit_amount: i.price,            // already in cents from your front-end
        product_data: {
          name:        i.name,
          description: i.description,
          images:      [ i.image ],
        },
      },
      quantity: i.quantity,
    }));

    // (c) create the Checkout Session
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
