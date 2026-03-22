/**
 * Backend-agnostic SMS service helper.
 * 
 * Sends SMS via a generic HTTP endpoint configured in VITE_SMS_API_URL.
 */

const SMS_API_URL = import.meta.env.VITE_SMS_API_URL;

export type SmsType =
  | 'appointment_confirmation'
  | 'doctor_booking_notification'
  | 'payment_receipt';

interface SmsResponse {
  success?: boolean;
  message?: string;
  error?: string;
  sid?: string;
}

export async function sendSms(
  type: SmsType,
  data: Record<string, any>
): Promise<SmsResponse> {
  if (!SMS_API_URL) {
    console.warn('VITE_SMS_API_URL is not configured. SMS not sent.');
    return { error: 'SMS service not configured' };
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Pass Supabase Auth token if interacting directly with Edge Function
    if (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
      headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;
    }

    const res = await fetch(SMS_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ type, data }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error(`SMS (${type}) failed:`, result);
      return { error: result.error || 'Failed to send SMS' };
    }

    console.log(`SMS (${type}) sent successfully:`, result.message);
    return result;
  } catch (error: any) {
    console.error(`SMS (${type}) error:`, error);
    return { error: error.message || 'Network error' };
  }
}
