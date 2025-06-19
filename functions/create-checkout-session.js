// functions/create-checkout-session.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const { items, shipping, currency, email } = JSON.parse(event.body);

  // 1. (unchanged) Create a customer with shipping…
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

  // 2. Create checkout session with description + images + correct unit_amount
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ["card"],
    mode: "payment",
    line_items: items.map(i => ({
      price_data: {
        currency,
        unit_amount: Math.round(i.price * 100),    // <-- ensure price is in cents
        product_data: {
          name: i.name,
          description: i.description,               // <-- pull in your description
          images: [ i.image ]                       // <-- pull in your image URL
        }
      },
      quantity: i.quantity
    })),
    success_url: `https://YOUR-SITE.com/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `https://YOUR-SITE.com/canceled`
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ sessionId: session.id })
  };
};
