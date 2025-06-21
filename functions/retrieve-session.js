// functions/retrieve-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const CORS = {
  'Access-Control-Allow-Origin': 'https://www.wevierart.com', 
  'Access-Control-Allow-Methods': 'OPTIONS, GET',
  'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: CORS,
      body: 'Method Not Allowed'
    };
  }

  const { session_id } = event.queryStringParameters || {};

  if (!session_id) {
    return {
      statusCode: 400,
      headers: CORS,
      body: 'Missing session_id'
    };
  }

  try {
    // expand line_items so we get product name, amount, qty
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items.data.price.product']
    });

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify(session)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS,
      body: err.message
    };
  }
};
