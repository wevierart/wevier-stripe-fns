// functions/create-checkout-session.js
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const { items, shipping } = JSON.parse(event.body);
    const line_items = items.map(i => ({
      price_data: {
        currency: 'eur',
        product_data: { name: i.name },
        unit_amount: i.price
      },
      quantity: i.quantity
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['US','GB','DE','FR','IT','ES','AU','CA']
      },
      success_url: 'https://www.wevierart.com/checkout-success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://www.wevierart.com/checkout-cancelled'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
