// netlify/functions/create-checkout-session.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const { items, shipping, currency, email } = JSON.parse(event.body);

  // 1) Create a Stripe Customer with the shipping you collected
  const customer = await stripe.customers.create({
    email,
    shipping: {
      name: shipping.name,
      address: {
        line1:       shipping.address,
        line2:       shipping.address2,
        city:        shipping.city,
        state:       shipping.state,
        postal_code: shipping.zip,
        country:     shipping.country,
      }
    }
  });

  // 2) Create the Checkout Session, pointing at that customer
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,               // ← here!
    payment_method_types: ["card"],
    mode:              "payment",
    line_items: items.map(i => ({
      price_data: {
        currency,
        unit_amount: i.price,
        product_data: {
          name:   i.name,
          images: [ i.image ]            // ← here!
        }
      },
      quantity: i.quantity
    })),
    success_url: `https://your-site.com/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `https://your-site.com/canceled`
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ sessionId: session.id })
  };
};
