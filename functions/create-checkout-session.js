// functions/create-checkout-session.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// lock CORS down to your Webflow domain
const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "https://www.wevierart.com",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
  "Access-Control-Allow-Headers": "Content-Type",
};

exports.handler = async (event) => {
  // 1) Preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  // 2) Only POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: "Method Not Allowed",
    };
  }

  // 3) Parse JSON
  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: "Invalid JSON",
    };
  }

  const { email, items, currency = "usd" } = data;

  try {
    // 4) Build your line items using the same field names you send from the front-end:
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: items.map((i) => ({
        price_data: {
          currency,
          product_data: { name: i.name, description: i.description || "" },
          unit_amount: i.unit_amount,   // ← use the unit_amount your JS sends
        },
        quantity: i.quantity,
      })),
      mode: "payment",
      success_url: "https://www.wevierart.com/success",
      cancel_url:  "https://www.wevierart.com/cancel",
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ sessionId: session.id }),
    };
  } catch (err) {
    console.error("Stripe error:", err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
