// functions/create-checkout-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Lock CORS down to only your Webflow domain
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://www.wevierart.com',
  'Access-Control-Allow-Methods': 'OPTIONS, POST',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  // 1) Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  // 2) Only POSTs allowed
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: 'Method Not Allowed',
    };
  }

  // 3) Parse JSON payload
  let data;
  try {
    data = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: 'Invalid JSON',
    };
  }

  const { email, items, currency = 'usd' } = data;

  // Basic validation
  if (!email || !Array.isArray(items) || items.length === 0) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: 'Missing email or items',
    };
  }

  try {
    // 4) Create the Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],          // add more in your Stripe Dashboard
      customer_email:       email,
      shipping_address_collection: {
        allowed_countries: ['US', 'GB', 'CA'], // adjust to your shippable zones
      },
      line_items: items.map((i) => ({
        price_data: {
          currency:      currency.toLowerCase(),
          product_data:  { name: i.name },
          unit_amount:   i.unit_amount || Math.round(i.price * 100),
        },
        quantity: i.quantity,
      })),
      mode:        'payment',
      success_url: 'https://www.wevierart.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:  'https://www.wevierart.com/cancel',
    });

    // 5) Return the session ID
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ sessionId: session.id }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: err.message,
    };
  }
};
