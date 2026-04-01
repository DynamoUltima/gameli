const { onRequest } = require("firebase-functions/v2/https");

const SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send";
const SENDER_EMAIL = "support@gamalielshospital.com";
const SENDER_NAME = "St. Gamaliel's Hospital";
const HOSPITAL_NAME = "St. Gamaliel's Hospital";
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

// ─── SMS Function ─────────────────────────────────────────────────────────────

exports.sendSms = onRequest({ cors: true, region: "europe-west1", invoker: "public" }, async (request, response) => {
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

  const NALO_AUTH_KEY = process.env.NALO_AUTH_KEY;
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

// ─── Email Templates ──────────────────────────────────────────────────────────

function baseLayout(title, body) {
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

function getEmailContent(type, data) {
  switch (type) {
    case "appointment_confirmation":
      return {
        to: data.patientEmail,
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

    case "doctor_booking_notification":
      return {
        to: data.doctorEmail,
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

    case "partner_fertility_form":
      return {
        to: data.partnerEmail,
        subject: `Fertility Questionnaire — ${HOSPITAL_NAME}`,
        html: baseLayout("Fertility Questionnaire", `
          <p>Hello,</p>
          <p>Your partner has booked a fertility consultation at <strong>${HOSPITAL_NAME}</strong> and has listed you as their partner.</p>
          <p>As part of the consultation preparation, we need you to complete a <strong>${data.formType === "male_fertility" ? "Male" : "Female"} Fertility Questionnaire</strong>.</p>
          <div class="detail-box">
            <div class="detail-row"><span class="detail-label">Form Type</span><span class="detail-value" style="text-transform:capitalize">${(data.formType || "Fertility Form").replace("_", " ")}</span></div>
            <div class="detail-row"><span class="detail-label">Appointment</span><span class="detail-value">${data.date || "Scheduled"}</span></div>
          </div>
          <p>Please contact the hospital or log in to your patient portal to access your questionnaire.</p>
          <p style="color:#94a3b8;font-size:13px;">— The ${HOSPITAL_NAME} Team</p>
        `),
      };

    case "fertility_form_link":
      return {
        to: data.patientEmail,
        subject: `Your Fertility Form — ${HOSPITAL_NAME}`,
        html: baseLayout("Fertility Intake Form", `
          <p>Hi <strong>${data.patientName || "there"}</strong>,</p>
          <p>A Fertility Intake Form has been assigned to you for your upcoming appointment.</p>
          <p>Please click the link below to complete it:</p>
          <a href="${data.formLink || "#"}" class="btn">Complete Your Form</a>
          <p style="color:#94a3b8;font-size:13px;">— The ${HOSPITAL_NAME} Team</p>
        `),
      };

    case "doctor_welcome":
      return {
        to: data.email,
        subject: `Welcome to ${HOSPITAL_NAME}`,
        html: baseLayout("Welcome Aboard, Doctor!", `
          <p>Hi <strong>Dr. ${data.name || ""}</strong>,</p>
          <p>An account has been created for you at <strong>${HOSPITAL_NAME}'s</strong> digital platform.</p>
          <div class="detail-box">
            <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${data.email || "—"}</span></div>
            <div class="detail-row"><span class="detail-label">Temporary Password</span><span class="detail-value">${data.tempPassword || "—"}</span></div>
          </div>
          <p>Please log in and change your password as soon as possible.</p>
          <a href="${data.loginUrl || "#"}" class="btn">Log In to Your Account</a>
          <p style="color:#94a3b8;font-size:13px;">If you didn't expect this email, please contact the hospital administration.</p>
        `),
      };

    case "patient_welcome":
      return {
        to: data.email,
        subject: `Welcome to ${HOSPITAL_NAME}!`,
        html: baseLayout("Welcome!", `
          <p>Hi <strong>${data.name || "there"}</strong>,</p>
          <p>Thank you for registering with <strong>${HOSPITAL_NAME}</strong>. Your patient account is now active.</p>
          <ul style="color:#475569;font-size:14px;line-height:2;padding-left:20px;margin:16px 0">
            <li>Book appointments with our specialists</li>
            <li>Access your medical records</li>
            <li>Join online consultations</li>
          </ul>
          <a href="${data.loginUrl || "#"}" class="btn">Go to Your Dashboard</a>
          <p style="color:#94a3b8;font-size:13px;">— The ${HOSPITAL_NAME} Team</p>
        `),
      };

    case "payment_receipt":
      return {
        to: data.patientEmail,
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
          <p>Thank you for choosing ${HOSPITAL_NAME}.</p>
          <p style="color:#94a3b8;font-size:13px;">— The ${HOSPITAL_NAME} Billing Team</p>
        `),
      };

    case "bulk_message":
      return {
        to: data.to,
        subject: data.subject || `Message from ${HOSPITAL_NAME}`,
        html: baseLayout(data.subject || `Message from ${HOSPITAL_NAME}`,
          (data.message || "").split("\n").map(line => `<p>${line}</p>`).join("") +
          `<p style="color:#94a3b8;font-size:13px;">— The ${HOSPITAL_NAME} Team</p>`
        ),
      };

    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}

// ─── Email Function ───────────────────────────────────────────────────────────

exports.sendEmail = onRequest({ cors: true, region: "europe-west1", invoker: "public" }, async (request, response) => {
  if (request.method !== "POST") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  const { type, data } = request.body || {};

  if (!type || !data) {
    response.status(400).json({ error: "Missing 'type' or 'data' in request body" });
    return;
  }

  try {
    const { to, subject, html } = getEmailContent(type, data);

    if (!to) {
      response.status(400).json({ error: `No recipient email for type: ${type}` });
      return;
    }

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
      response.status(500).json({ error: "Failed to send email", details: errorText });
      return;
    }

    response.json({ success: true, message: `Email (${type}) sent to ${to}` });
  } catch (error) {
    console.error("sendEmail error:", error);
    response.status(500).json({ error: error.message || "Internal server error" });
  }
});
