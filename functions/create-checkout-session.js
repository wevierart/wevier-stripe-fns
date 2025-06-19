// functions/create-checkout-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const CORS = {
  "Access-Control-Allow-Origin":  "https://www.wevierart.com",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
  "Access-Control-Allow-Headers": "Content-Type"
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: "Method Not Allowed" };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: CORS, body: "Invalid JSON" };
  }

  // Build Stripe line items
  const line_items = data.items.map(i => ({
    price_data: {
      currency: data.currency,
      product_data: {
        name:        i.name,
        description: `${i.material} | ${i.size} | ${i.frame}`,
        images:      [ i.image ]
      },
      unit_amount: i.price
    },
    quantity: i.quantity
  }));

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: data.email,
      line_items,
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['US','GB','DE','FR','IT','ES','AU','CA']
      },
      success_url: `https://www.wevierart.com/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `https://www.wevierart.com/checkout-cancelled`
    });

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ sessionId: session.id })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message })
    };
  }
};
