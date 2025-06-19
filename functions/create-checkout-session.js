// functions/create-checkout-session.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",     // or your exact origin
  "Access-Control-Allow-Methods": "OPTIONS, POST",
  "Access-Control-Allow-Headers": "Content-Type",
};

exports.handler = async (event) => {
  // 1) Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  try {
    // 2) Parse incoming JSON
    const { items, shipping, currency, email } = JSON.parse(event.body);

    // 3) (Optional) Create a customer so you can attach shipping info
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

    // 4) Build the Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      mode: "payment",

      // ← show shipping fields on the Stripe page
      shipping_address_collection: {
        allowed_countries: ["US","GB","DE","FR","IT","ES","AU","CA"]
      },

      // ← your line items, with image & description
      line_items: items.map(i => ({
        price_data: {
          currency,
          unit_amount: Math.round(i.price * 100),   // price ×100 → cents
          product_data: {
            name:        i.name,
            description: `${i.material} | ${i.size} | ${i.frame}`,
            images:      [ i.image ]               // your CMS image URL
          },
        },
        quantity: i.quantity,
      })),

      success_url: `https://www.wevierart.com/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `https://www.wevierart.com/checkout-canceled`,
    });

    // 5) Return session ID
    return {
      statusCode: 200,
      headers:    CORS_HEADERS,
      body:       JSON.stringify({ sessionId: session.id }),
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers:    CORS_HEADERS,
      body:       JSON.stringify({ error: err.message }),
    };
  }
};
