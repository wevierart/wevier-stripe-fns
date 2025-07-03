// functions/create-paypal-order.js
const paypal = require('@paypal/checkout-server-sdk')

// Choose sandbox or live based on your env
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  return new paypal.core.SandboxEnvironment(clientId, clientSecret)
}

function client() {
  return new paypal.core.PayPalHttpClient(environment())
}

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch (err) {
    return {
      statusCode: 400,
      body: 'Invalid JSON'
    }
  }

  const { items, email, subtotal } = body

  // Build the PayPal order
  const request = new paypal.orders.OrdersCreateRequest()
  request.prefer('return=representation')
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'EUR',
          value: Number(subtotal).toFixed(2)
        },
        payee: {
          email_address: email
        }
      }
    ],
    application_context: {
      return_url: `${process.env.URL}/success`,
      cancel_url: `${process.env.URL}/cancel`
    }
  })

  try {
    const response = await client().execute(request)
    return {
      statusCode: 200,
      body: JSON.stringify({ id: response.result.id })
    }
  } catch (err) {
    console.error('PayPal create error', err)
    return {
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ message: err.message })
    }
  }
}
