const { onRequest } = require("firebase-functions/v2/https");

exports.sendSms = onRequest({ cors: true, region: "europe-west1" }, async (request, response) => {
  if (request.method !== "POST") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  const body = request.body || {};
  const phone = body.phone;
  const message = body.message;

  if (!phone || !message) {
    response.status(400).send("Phone and message are required in body");
    return;
  }

  const cleanPhone = String(phone).replace("+", "").replace(/ /g, "");

  const NALO_AUTH_KEY = "zhIsqKhY5Fxc3GQd58QjssYg0lkaz0sbZvRxmQ6W181k7XD9vQWE8orKAv6pVY16";
  const NALO_SENDER_ID = "WONDABYTE";

  const url = `https://sms.nalosolutions.com/smsbackend/Resl_Nalo/send-message/?key=${NALO_AUTH_KEY}&type=1&destination=${cleanPhone}&source=${NALO_SENDER_ID}&message=${encodeURIComponent(message)}`;

  try {
    const fetchResponse = await fetch(url);
    const text = await fetchResponse.text();
    response.json({ success: true, api_response: text });
  } catch (error) {
    response.status(500).json({ success: false, error: error.message });
  }
});
