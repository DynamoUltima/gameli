import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Formatting helpers ──────────────────────────────────────────

function formatPhoneNumber(phone: string): string {
  // Strip non-numeric characters except leading '+'
  let formatted = phone.replace(/[^\d+]/g, '');
  // If no country code, default to Ghana +233
  if (!formatted.startsWith('+')) {
    if (formatted.startsWith('0')) {
      formatted = '+233' + formatted.substring(1);
    } else {
      formatted = '+233' + formatted;
    }
  }
  return formatted;
}

// ─── SMS Content Generator ─────────────────────────────────────

function getSmsContent(type: string, data: any): { body: string; to: string } {
  let body = "";
  let to = data.patientPhone || data.phone;

  switch (type) {
    case "appointment_confirmation":
      body = `Hi ${data.patientName}, your appointment with ${data.doctorName} at St. Gamaliel's Hospital is confirmed for ${data.date} at ${data.time}. Reply STOP to opt out.`;
      break;
    case "doctor_booking_notification":
      to = data.doctorPhone;
      body = `Dr. ${data.doctorName}, you have a new ${data.type} booking with ${data.patientName} on ${data.date} at ${data.time}.`;
      break;
    case "payment_receipt":
      body = `Payment of ${data.amount} GHS received for your appointment on ${data.date} at St. Gamaliel's Hospital. Thank you.`;
      break;
    default:
      throw new Error(`Unknown SMS type: ${type}`);
  }

  if (!to) throw new Error(`No recipient phone number provided for type: ${type}`);
  return { body, to: formatPhoneNumber(to) };
}

// ─── Main Handler ───────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const NALO_AUTH_KEY = Deno.env.get("NALO_AUTH_KEY");
    const NALO_SENDER_ID = Deno.env.get("NALO_SENDER_ID");

    if (!NALO_AUTH_KEY || !NALO_SENDER_ID) {
      throw new Error("Nalo environment variables are not properly configured");
    }

    const { type, data } = await req.json();

    if (!type || !data) {
      return new Response(
        JSON.stringify({ error: "Missing 'type' or 'data' in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { body, to } = getSmsContent(type, data);

    const naloTo = to.replace(/\D/g, ''); // Nalo prefers digits only

    const params = new URLSearchParams({
      key: NALO_AUTH_KEY,
      type: '0',
      destination: naloTo,
      dlr: '1',
      source: NALO_SENDER_ID,
      message: body
    });

    const naloUrl = `https://sms.nalosolutions.com/smsbackend/clientapi/Resl_Nalo/send-message/?${params.toString()}`;

    const naloResponse = await fetch(naloUrl, { method: "GET" });
    const responseText = await naloResponse.text();

    console.log("Nalo Response:", responseText);

    if (responseText.includes("1707")) {
        return new Response(
            JSON.stringify({ error: "Failed to send SMS", details: "Invalid Sender ID (1707)" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } else if (responseText.includes("1706")) {
        return new Response(
            JSON.stringify({ error: "Failed to send SMS", details: "Invalid Destination (1706)" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, message: `SMS (${type}) sent to ${to}`, raw: responseText }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
