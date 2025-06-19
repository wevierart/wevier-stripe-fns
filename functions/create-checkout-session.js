// functions/create-checkout-session.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*" /* or "https://www.wevierart.com" */,
  "Access-Control-Allow-Methods": "OPTIONS, POST",
  "Access-Control-Allow-Headers": "Content-Type",
};

exports.handler = async function(event) {
  // 1) Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  try {
    // 2) Parse the incoming JSON body
    const { items, shipping, currency, email } = JSON.parse(event.body);

    // 3) Create a Stripe Customer with shipping address
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

    // 4) Create the Checkout Session, passing along
    //    • the Customer so their shipping shows up  
    //    • your image URL so it surfaces in Stripe  
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      mode:                 "payment",
      line_items: items.map(i => ({
        price_data: {
          currency,
          unit_amount: i.price,
          product_data: {
            name:   i.name,
            images: [ i.image ],      // ← your image URL
          },
        },
        quantity: i.quantity,
      })),
      success_url: `https://www.wevierart.com/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `https://www.wevierart.com/checkout-canceled`,
    });

    // 5) Return the session ID
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
