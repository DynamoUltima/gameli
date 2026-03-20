import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send";
const SENDER_EMAIL = "support@gamalielshospital.com";
const SENDER_NAME = "St. Gamaliel's Hospital";
const HOSPITAL_NAME = "St. Gamaliel's Hospital";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Email Templates ────────────────────────────────────────────

function baseLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
  .wrap{max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0}
  .header{background:#0f172a;padding:32px 40px;text-align:center}
  .header h1{color:#fff;font-size:18px;font-weight:600;margin:0;letter-spacing:-0.02em}
  .body{padding:40px}
  .body h2{color:#0f172a;font-size:22px;font-weight:600;margin:0 0 8px;letter-spacing:-0.02em}
  .body p{color:#64748b;font-size:15px;line-height:1.7;margin:0 0 16px}
  .detail-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin:24px 0}
  .detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9}
  .detail-row:last-child{border-bottom:none}
  .detail-label{color:#94a3b8;font-size:13px;font-weight:500}
  .detail-value{color:#0f172a;font-size:14px;font-weight:600;text-align:right}
  .btn{display:inline-block;padding:14px 32px;background:#0f172a;color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:600;margin:24px 0}
  .footer{padding:24px 40px;text-align:center;border-top:1px solid #f1f5f9}
  .footer p{color:#94a3b8;font-size:12px;margin:0}
</style></head><body>
<div class="wrap">
  <div class="header"><h1>🏥 ${HOSPITAL_NAME}</h1></div>
  <div class="body"><h2>${title}</h2>${body}</div>
  <div class="footer"><p>&copy; ${new Date().getFullYear()} ${HOSPITAL_NAME}. All rights reserved.</p></div>
</div>
</body></html>`;
}

function appointmentConfirmationEmail(data: any): { subject: string; html: string } {
  return {
    subject: `Appointment Confirmed — ${data.date}`,
    html: baseLayout("Appointment Confirmed", `
      <p>Hi <strong>${data.patientName || "there"}</strong>,</p>
      <p>Your appointment has been successfully booked. Here are the details:</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Doctor</span><span class="detail-value">${data.doctorName || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Specialty</span><span class="detail-value">${data.specialty || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${data.date || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Time</span><span class="detail-value">${data.time || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Type</span><span class="detail-value" style="text-transform:capitalize">${data.type || "—"}</span></div>
      </div>
      <p>If you need to make any changes, please contact our support team or visit your patient dashboard.</p>
      <p style="color:#94a3b8;font-size:13px;">— The ${HOSPITAL_NAME} Team</p>
    `),
  };
}

function doctorBookingNotificationEmail(data: any): { subject: string; html: string } {
  return {
    subject: `New Booking: ${data.patientName || "A patient"} — ${data.date}`,
    html: baseLayout("New Appointment Booking", `
      <p>Hi <strong>Dr. ${data.doctorName || ""}</strong>,</p>
      <p>You have a new appointment booking:</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Patient</span><span class="detail-value">${data.patientName || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${data.date || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Time</span><span class="detail-value">${data.time || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Type</span><span class="detail-value" style="text-transform:capitalize">${data.type || "—"}</span></div>
      </div>
      <p>Please check your dashboard for full details.</p>
      <p style="color:#94a3b8;font-size:13px;">— ${HOSPITAL_NAME} System</p>
    `),
  };
}

function partnerFertilityFormEmail(data: any): { subject: string; html: string } {
  return {
    subject: `Fertility Questionnaire — ${HOSPITAL_NAME}`,
    html: baseLayout("Fertility Questionnaire", `
      <p>Hello,</p>
      <p>Your partner has booked a fertility consultation at <strong>${HOSPITAL_NAME}</strong> and has listed you as their partner.</p>
      <p>As part of the consultation preparation, we need you to complete a <strong>${data.formType === 'male_fertility' ? 'Male' : 'Female'} Fertility Questionnaire</strong>.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Form Type</span><span class="detail-value" style="text-transform:capitalize">${data.formType?.replace('_', ' ') || "Fertility Form"}</span></div>
        <div class="detail-row"><span class="detail-label">Appointment</span><span class="detail-value">${data.date || "Scheduled"}</span></div>
      </div>
      <p>Please contact the hospital or log in to your patient portal to access your questionnaire.</p>
      <p style="color:#94a3b8;font-size:13px;">— The ${HOSPITAL_NAME} Team</p>
    `),
  };
}

function doctorWelcomeEmail(data: any): { subject: string; html: string } {
  return {
    subject: `Welcome to ${HOSPITAL_NAME}`,
    html: baseLayout("Welcome Aboard, Doctor!", `
      <p>Hi <strong>Dr. ${data.name || ""}</strong>,</p>
      <p>An account has been created for you at <strong>${HOSPITAL_NAME}'s</strong> digital platform.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${data.email || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Temporary Password</span><span class="detail-value">${data.tempPassword || "—"}</span></div>
      </div>
      <p>Please log in and change your password as soon as possible.</p>
      <a href="${data.loginUrl || '#'}" class="btn">Log In to Your Account</a>
      <p style="color:#94a3b8;font-size:13px;">If you didn't expect this email, please contact the hospital administration.</p>
    `),
  };
}

function patientWelcomeEmail(data: any): { subject: string; html: string } {
  return {
    subject: `Welcome to ${HOSPITAL_NAME}!`,
    html: baseLayout("Welcome!", `
      <p>Hi <strong>${data.name || "there"}</strong>,</p>
      <p>Thank you for registering with <strong>${HOSPITAL_NAME}</strong>. Your patient account is now active.</p>
      <p>You can now:</p>
      <ul style="color:#475569;font-size:14px;line-height:2;padding-left:20px;margin:16px 0">
        <li>Book appointments with our specialists</li>
        <li>Access your medical records</li>
        <li>Join online consultations</li>
      </ul>
      <a href="${data.loginUrl || '#'}" class="btn">Go to Your Dashboard</a>
      <p style="color:#94a3b8;font-size:13px;">— The ${HOSPITAL_NAME} Team</p>
    `),
  };
}

function paymentReceiptEmail(data: any): { subject: string; html: string } {
  return {
    subject: `Payment Receipt — ${HOSPITAL_NAME}`,
    html: baseLayout("Payment Successful", `
      <p>Hi <strong>${data.patientName || "there"}</strong>,</p>
      <p>We have successfully received your payment for your upcoming consultation.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Amount Paid</span><span class="detail-value" style="color:#10b981">${data.amount || "—"} GHS</span></div>
        <div class="detail-row"><span class="detail-label">Service</span><span class="detail-value" style="text-transform:capitalize">${data.type || "Online Consultation"}</span></div>
        <div class="detail-row"><span class="detail-label">Doctor</span><span class="detail-value">${data.doctorName || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Specialty</span><span class="detail-value">${data.specialty || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Date & Time</span><span class="detail-value">${data.date || ""} at ${data.time || ""}</span></div>
      </div>
      <p>Thank you for choosing ${HOSPITAL_NAME}. You can download your detailed receipt from your patient dashboard.</p>
      <p style="color:#94a3b8;font-size:13px;">— The ${HOSPITAL_NAME} Billing Team</p>
    `),
  };
}

// ─── Template Router ────────────────────────────────────────────

function getEmailContent(type: string, data: any): { subject: string; html: string; to: string } {
  let content: { subject: string; html: string };
  let to: string;

  switch (type) {
    case "appointment_confirmation":
      content = appointmentConfirmationEmail(data);
      to = data.patientEmail;
      break;
    case "doctor_booking_notification":
      content = doctorBookingNotificationEmail(data);
      to = data.doctorEmail;
      break;
    case "partner_fertility_form":
      content = partnerFertilityFormEmail(data);
      to = data.partnerEmail;
      break;
    case "doctor_welcome":
      content = doctorWelcomeEmail(data);
      to = data.email;
      break;
    case "patient_welcome":
      content = patientWelcomeEmail(data);
      to = data.email;
      break;
    case "payment_receipt":
      content = paymentReceiptEmail(data);
      to = data.patientEmail;
      break;
    default:
      throw new Error(`Unknown email type: ${type}`);
  }

  if (!to) throw new Error(`No recipient email provided for type: ${type}`);
  return { ...content, to };
}

// ─── Main Handler ───────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    if (!SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY is not configured");
    }

    const { type, data } = await req.json();

    if (!type || !data) {
      return new Response(
        JSON.stringify({ error: "Missing 'type' or 'data' in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subject, html, to } = getEmailContent(type, data);

    const sgResponse = await fetch(SENDGRID_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: SENDER_EMAIL, name: SENDER_NAME },
        subject,
        content: [{ type: "text/html", value: html }],
      }),
    });

    if (!sgResponse.ok) {
      const errorText = await sgResponse.text();
      console.error("SendGrid error:", sgResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: `Email (${type}) sent to ${to}` }),
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
