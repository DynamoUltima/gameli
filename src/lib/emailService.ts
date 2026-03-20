/**
 * Backend-agnostic email service helper.
 * 
 * Sends emails via a generic HTTP endpoint configured in VITE_EMAIL_API_URL.
 * To switch backends (Supabase → Firebase, etc.), just deploy a new function
 * and update the URL in .env. No frontend code changes needed.
 */

const EMAIL_API_URL = import.meta.env.VITE_EMAIL_API_URL;

export type EmailType =
  | 'appointment_confirmation'
  | 'doctor_booking_notification'
  | 'partner_fertility_form'
  | 'doctor_welcome'
  | 'patient_welcome'
  | 'payment_receipt';

interface EmailResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

export async function sendEmail(
  type: EmailType,
  data: Record<string, any>
): Promise<EmailResponse> {
  if (!EMAIL_API_URL) {
    console.warn('VITE_EMAIL_API_URL is not configured. Email not sent.');
    return { error: 'Email service not configured' };
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
      headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;
    }

    const res = await fetch(EMAIL_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ type, data }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error(`Email (${type}) failed:`, result);
      return { error: result.error || 'Failed to send email' };
    }

    console.log(`Email (${type}) sent successfully:`, result.message);
    return result;
  } catch (error: any) {
    console.error(`Email (${type}) error:`, error);
    return { error: error.message || 'Network error' };
  }
}
