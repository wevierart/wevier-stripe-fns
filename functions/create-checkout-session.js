// functions/create-checkout-session.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// lock CORS down to your domain
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://www.wevierart.com",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
  "Access-Control-Allow-Headers": "Content-Type",
};

exports.handler = async (event) => {
  // 1) CORS preflight
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
  const { email, items, currency } = data;

  try {
    // 4) Create the Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      // you removed shipping, so no shipping_address_collection
      line_items: items.map((i) => ({
        price_data: {
          currency: currency || "usd",
          product_data: {
            name: i.name,
            description: i.description || undefined,
          },
          unit_amount: i.unit_amount,
        },
        quantity: i.quantity,
      })),
      mode: "payment",
      success_url: "https://www.wevierart.com/success",
      cancel_url: "https://www.wevierart.com/cancel",
    });

    // 5) Return the session ID
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ sessionId: session.id }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: err.message,
    };
  }
};
