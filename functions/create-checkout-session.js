// functions/create-checkout-session.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Universal CORS headers
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://www.wevierart.com",            // or lock it down to "https://www.wevierart.com"
  "Access-Control-Allow-Methods": "OPTIONS, POST",
  "Access-Control-Allow-Headers": "Content-Type"
};

exports.handler = async (event) => {
  // 1) Handle the browser’s CORS preflight request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: ""            // no payload on preflight
    };
  }

  // 2) Reject anything other than POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: "Method Not Allowed"
    };
  }

  // 3) Parse the JSON body
  let data;
  try {
    data = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: "Invalid JSON"
    };
  }

  const { email, shipping, items } = data;

  try {
    // 4) Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      shipping_address_collection: { allowed_countries: ["US","GB","CA"] },
      line_items: items.map(i => ({
        price_data: {
          currency: "usd",
          product_data: { name: i.name },
          unit_amount: i.price,
        },
        quantity: i.quantity,
      })),
      mode: "payment",
      success_url: "https://www.wevierart.com/success",
      cancel_url:  "https://www.wevierart.com/cancel",
    });

    // 5) Return the session ID with CORS headers
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
