// functions/create-checkout-session.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // 1) CORS
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, POST",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  try {
    // 2) Parse
    const { items, shipping, email, currency } = JSON.parse(event.body);

    // 3) (Optional) create a Stripe customer so shipping shows up
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
        },
      },
    });

    // 4) Build line_items
    const line_items = items.map(i => ({
      price_data: {
        currency,
        unit_amount: Math.round(i.price * 100),
        product_data: {
          name:        i.name,
          description: `${i.material} | ${i.size} | ${i.frame}`,
          images:      [ i.image ],       // <-- your CMS image URL
        },
      },
      quantity: i.quantity,
    }));

    // 5) Create session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      shipping_address_collection: {
        allowed_countries: ["US","GB","DE","FR","IT","ES","AU","CA"]
      },
      success_url: "https://www.wevierart.com/checkout-success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url:  "https://www.wevierart.com/checkout-canceled",
    });

    // 6) Return
    return {
      statusCode: 200,
      headers:    CORS,
      body:       JSON.stringify({ sessionId: session.id }),
    };

  } catch (err) {
    console.error("❌ create-checkout-session error:", err);
    return {
      statusCode: 500,
      headers:    CORS,
      body:       JSON.stringify({ error: err.message }),
    };
  }
};
