import { addMonths } from "date-fns";

// A payment is valid for this many months from the date it was made.
// This is the single source of truth for the "valid for 3 months" policy
// shown on receipts, the PaymentSuccess page, the FAQ, and admin tracking.
export const PAYMENT_VALIDITY_MONTHS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface PaymentValidity {
  isPaid: boolean;
  paidAt: Date | null;
  expiresAt: Date | null;
  isExpired: boolean;
  /** Whole days remaining until expiry (>= 0). null when not paid / unknown. */
  daysLeft: number | null;
}

/** Minimal appointment shape (snake_case, as stored in Firestore / returned by the shim). */
export interface PaymentValidityInput {
  payment_status?: string | null;
  paid_at?: string | null;
  payment_expires_at?: string | null;
  created_at?: string | null;
}

/**
 * Derive payment-validity info for an appointment.
 *
 * Expiry is taken from the stored `payment_expires_at` when present; otherwise
 * it is derived from the payment moment (`paid_at`, falling back to `created_at`
 * for legacy bookings that were paid immediately after creation and never had a
 * `paid_at` recorded). The window is anchored to the PAYMENT date — not the
 * appointment date and never to "now" — so it does not slide as the receipt is
 * re-viewed.
 */
export function getPaymentValidity(appt: PaymentValidityInput | null | undefined): PaymentValidity {
  const empty: PaymentValidity = {
    isPaid: false, paidAt: null, expiresAt: null, isExpired: false, daysLeft: null,
  };
  if (!appt || appt.payment_status !== "paid") return empty;

  const paidAtStr = appt.paid_at || appt.created_at || null;
  const paidAt = paidAtStr ? new Date(paidAtStr) : null;

  let expiresAt: Date | null = null;
  if (appt.payment_expires_at) {
    expiresAt = new Date(appt.payment_expires_at);
  } else if (paidAt && !isNaN(paidAt.getTime())) {
    expiresAt = addMonths(paidAt, PAYMENT_VALIDITY_MONTHS);
  }

  if (!expiresAt || isNaN(expiresAt.getTime())) {
    return { isPaid: true, paidAt, expiresAt: null, isExpired: false, daysLeft: null };
  }

  const now = Date.now();
  const isExpired = now > expiresAt.getTime();
  const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - now) / DAY_MS));

  return { isPaid: true, paidAt, expiresAt, isExpired, daysLeft };
}

/** The expiry timestamp to persist at payment time (ISO string). */
export function computePaymentExpiry(paidAt: Date = new Date()): string {
  return addMonths(paidAt, PAYMENT_VALIDITY_MONTHS).toISOString();
}
