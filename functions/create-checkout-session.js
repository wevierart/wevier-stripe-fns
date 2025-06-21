// functions/create-checkout-session.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://www.wevierart.com",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
  "Access-Control-Allow-Headers": "Content-Type",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: "Method Not Allowed",
    };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: CORS_HEADERS, body: "Invalid JSON" };
  }

  const { email, items, currency = "eur" } = data;
  if (!email || !Array.isArray(items) || items.length === 0) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: "Missing email or items",
    };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      shipping_address_collection: {
        allowed_countries: [
          "GB","US","CH","NZ","AU","CA","NO","IM",
          "AT","BE","BG","HR","CY","CZ","DK","EE",
          "FI","FR","DE","GR","HU","IE","IT","LV",
          "LT","LU","MT","NL","PL","PT","RO","SK",
          "SI","ES","SE"
        ],
      },
      line_items: items.map(i => ({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: i.name },
          unit_amount: i.unit_amount,      // ← use it directly
        },
        quantity: i.quantity,
      })),
      mode: "payment",
      success_url: `https://www.wevierart.com/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: "https://www.wevierart.com/cancel",
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
      body: err.message,
    };
  }
};
