require('dotenv').config();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // 1) Handle the CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://www.wevierart.com',      // your Webflow domain
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      }
    };
  }

  // 2) Parse body
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': 'https://www.wevierart.com' },
      body: JSON.stringify({ error: 'Invalid JSON' }),
    };
  }

  const { email, items } = body;

  try {
    // 3) Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email:      email,
      line_items:          items,
      mode:                'payment',
      success_url:         'https://www.wevierart.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:          'https://www.wevierart.com/custom-checkout',
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': 'https://www.wevierart.com' },
      body: JSON.stringify({ sessionId: session.id }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': 'https://www.wevierart.com' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
