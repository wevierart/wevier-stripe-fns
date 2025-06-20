// netlify/functions/create-checkout-session.js
require('dotenv').config();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // 1) Handle the CORS preflight (OPTIONS) request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://www.wevierart.com',         // or use '*'
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: ''
    };
  }

  // 2) Always include CORS on your real POST responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://www.wevierart.com',           // or '*'
  };

  // 3) Parse and validate your incoming JSON
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid JSON' }),
    };
  }

  const { email, items } = body;

  try {
    // 4) Create the Stripe session
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
      headers: corsHeaders,
      body: JSON.stringify({ sessionId: session.id }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
