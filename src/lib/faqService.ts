import { db } from "@/integrations/firebase/client";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";

export interface Faq {
  id: string;
  question: string;
  answer: string;
  order: number;
}

const COLLECTION = "faqs";

/**
 * Default FAQs used to seed the page when the Firestore collection is empty.
 * Admins can override/extend these from the dashboard.
 */
export const DEFAULT_FAQS: Omit<Faq, "id">[] = [
  {
    order: 0,
    question: "How do I book an appointment?",
    answer:
      "Choose a consultation type from the home page, pick an available doctor and time slot, then complete payment to confirm. You'll receive a confirmation by SMS and email along with a receipt.",
  },
  {
    order: 1,
    question: "How long is my payment valid?",
    answer:
      "Payments are valid for 3 months from the date of payment. The exact expiry date is shown on your receipt. Please use or reschedule your appointment before that date to avoid forfeiting your payment.",
  },
  {
    order: 2,
    question: "What happens if I miss my appointment?",
    answer:
      "Your payment remains valid for 3 months, so you can reschedule a missed appointment any time before the expiry date shown on your receipt. After that date the payment is forfeited.",
  },
  {
    order: 3,
    question: "Can I reschedule or cancel?",
    answer:
      "Yes. You can reschedule from your patient dashboard as long as your payment is still within its 3-month validity window. For cancellations or refund requests, contact us using the details below.",
  },
  {
    order: 4,
    question: "How do online (video) consultations work?",
    answer:
      "For online appointments, a secure video consultation link is sent to you about 15 minutes before your scheduled time. Make sure you have a stable internet connection and a quiet, private space.",
  },
  {
    order: 5,
    question: "Which payment methods are accepted?",
    answer:
      "Payments are processed securely through Paystack, which supports mobile money and bank cards. You will receive a downloadable PDF receipt once your payment is successful.",
  },
];

/** Fetch all FAQs ordered by their display order. */
export async function fetchFaqs(): Promise<Faq[]> {
  const q = query(collection(db, COLLECTION), orderBy("order", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Faq, "id">) }));
}

export async function addFaq(data: Omit<Faq, "id">): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), data);
  return ref.id;
}

export async function updateFaq(id: string, data: Partial<Omit<Faq, "id">>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data);
}

export async function deleteFaq(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
