// functions/create-checkout-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Allow only your domain to call this function
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://www.wevierart.com',
  'Access-Control-Allow-Methods': 'OPTIONS, POST',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  // 1) CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // 2) Only POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: 'Method Not Allowed',
    };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: 'Invalid JSON',
    };
  }

  const { email, items } = data;
  if (!email || !Array.isArray(items) || items.length === 0) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: 'Missing email or items',
    };
  }

  try {
    // 3) Build Stripe line_items, validating integer cents & quantity
    const line_items = items.map((i) => {
      const ua = Number(i.unit_amount);
      const qty = parseInt(i.quantity, 10);
      if (!Number.isInteger(ua) || ua <= 0) {
        throw new Error(`Invalid unit_amount for item “${i.name}”: ${i.unit_amount}`);
      }
      if (!Number.isInteger(qty) || qty <= 0) {
        throw new Error(`Invalid quantity for item “${i.name}”: ${i.quantity}`);
      }
      return {
        price_data: {
          currency: 'eur',
          product_data: { name: i.name },
          unit_amount: ua,
        },
        quantity: qty,
      };
    });

    // 4) Create the Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // any other methods you’ve turned on in your Dashboard
      customer_email: email,
      shipping_address_collection: {
        allowed_countries: [
          'GB','US','CH','NZ','AU','CA','NO','IM',
          'AT','BE','BG','HR','CY','CZ','DK','EE',
          'FI','FR','DE','GR','HU','IE','IT','LV',
          'LT','LU','MT','NL','PL','PT','RO','SK',
          'SI','ES','SE'
        ]
      },
      line_items,
      mode: 'payment',
      success_url: 'https://www.wevierart.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:  'https://www.wevierart.com/cancel',
    });

    // 5) Return session.id
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
