// netlify/functions/capture-paypal-order.js
const paypal = require('@paypal/checkout-server-sdk');
// … same CORS/OPTIONS boilerplate …
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') { /* … */ }
  if (event.httpMethod !== 'POST') return { statusCode: 405 }

  try {
    const { orderID } = JSON.parse(event.body)
    const request = new paypal.orders.OrdersCaptureRequest(orderID)
    request.requestBody({})
    const capture = await paypalClient.execute(request)

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(capture.result)
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    }
  }
}
