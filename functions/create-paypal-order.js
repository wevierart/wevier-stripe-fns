// functions/create-paypal-order.js

const paypal = require('@paypal/checkout-server-sdk')

// Pull your credentials from Netlify environment
const clientId     = process.env.PAYPAL_CLIENT_ID
const clientSecret = process.env.PAYPAL_CLIENT_SECRET
if (!clientId || !clientSecret) {
  console.error('Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET')
}

// Build PayPal SDK client
const env    = new paypal.core.SandboxEnvironment(clientId, clientSecret)
const client = new paypal.core.PayPalHttpClient(env)

exports.handler = async (event) => {
  // 1) CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  }

  // 2) Only POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { Allow: 'POST, OPTIONS' },
      body: 'Method Not Allowed',
    }
  }

  // 3) Parse JSON body
  let data
  try {
    data = JSON.parse(event.body)
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON' }
  }

  const { subtotal } = data
  if (!subtotal) {
    return { statusCode: 400, body: 'Missing subtotal' }
  }

  // 4) Build the order
  const request = new paypal.orders.OrdersCreateRequest()
  request.prefer('return=representation')
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'EUR',
        value: parseFloat(subtotal).toFixed(2)
      }
    }],
    application_context: {
      // these pages must exist in your Webflow site
      return_url: `${process.env.URL}/success`,
      cancel_url: `${process.env.URL}/cancel`
    }
  })

  // 5) Call PayPal
  try {
    const response = await client.execute(request)
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ id: response.result.id })
    }
  } catch (err) {
    console.error('PayPal create error', err)
    return {
      statusCode: err.statusCode || 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    }
  }
}
