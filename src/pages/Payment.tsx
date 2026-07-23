import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/lib/emailService";
import { sendSms } from "@/lib/smsService";
import { format } from "date-fns";
import { computePaymentExpiry } from "@/lib/paymentValidity";
import { usePaystackPayment } from "react-paystack";
import { useAuth } from "@/hooks/useAuth";

const Payment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get("amount") || "45";
  const appointmentId = searchParams.get("appointmentId");
  const appointmentType = searchParams.get("type") || "online";
  const { user } = useAuth();
  
  const [processing, setProcessing] = useState(false);
  const [patientData, setPatientData] = useState<any>(null);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (user) {
        const userId = (user as any).uid || (user as any).id;
        const { data } = await (supabase.from('profiles').select('*').eq('id', userId).maybeSingle() as any);
        setPatientData(data);
      }
    };
    fetchPatientData();
  }, [user]);

  const appointmentLabels: { [key: string]: { name: string; price: string; duration?: string } } = {
    online: { name: "Online Consultation", price: `${amount} GHS`, duration: "45 minutes" },
    hospital: { name: "Hospital Visit", price: `${amount} GHS`, duration: "N/A" },
    home: { name: "Home Visit", price: `${amount} GHS`, duration: "N/A" }
  };

  const handlePaymentSuccess = async (reference: any) => {
    setProcessing(true);
    try {
      if (appointmentId) {
        // Update to paid — record when payment happened and when it expires so
        // the 3-month validity can be tracked (not recomputed from "now").
        const paidAt = new Date();
        const { error: updateErr } = await supabase
          .from('appointments' as any)
          .update({
            payment_status: 'paid',
            paid_at: paidAt.toISOString(),
            payment_expires_at: computePaymentExpiry(paidAt),
          })
          .eq('id', appointmentId);
        
        if (updateErr) throw updateErr;

        // Fetch details for email
        const { data: appt } = await supabase
          .from('appointments' as any)
          .select('*')
          .eq('id', appointmentId)
          .maybeSingle();

        if (appt && appt.patient_id) {
            let doctorName = 'Your Doctor';
            let docPhone = '';
            let docEmail = '';
            
            if (appt.doctor_id) {
               const { data: docProfile } = await supabase.from('profiles').select('*').eq('id', appt.doctor_id).maybeSingle();
               if (docProfile) {
                 doctorName = docProfile.full_name;
                 docPhone = docProfile.phone;
                 docEmail = docProfile.email;
               }
            }
            
            if (patientData && patientData.email) {
              const dateObj = new Date(appt.scheduled_at);
              const notificationData = {
                patientEmail: patientData.email,
                patientPhone: patientData.phone,
                patientName: patientData.full_name || 'Patient',
                doctorName: doctorName,
                doctorPhone: docPhone,
                doctorEmail: docEmail,
                specialty: appt.clinic || 'General',
                date: format(dateObj, 'MMMM do, yyyy'),
                time: format(dateObj, 'h:mm a'),
                amount: amount,
                type: appointmentLabels[appointmentType]?.name || "Consultation"
              };

              // Send receipt via email and SMS
              await sendEmail('payment_receipt', notificationData);
              await sendSms('payment_receipt', notificationData);
              
              // Also send appointment confirmation if it wasn't triggered before
              // Since they book and pay sequentially, we handle both here
              await sendEmail('appointment_confirmation', notificationData);
              await sendSms('appointment_confirmation', notificationData);
            }
        }
      }

      toast.success("Payment successful!");
      navigate(`/payment-success?appointmentId=${appointmentId || ''}`);
    } catch (error) {
       console.error("Payment processing error:", error);
       toast.error("An error occurred while confirming your payment.");
    } finally {
       setProcessing(false);
    }
  };

  const config = {
    reference: (new Date()).getTime().toString(),
    email: patientData?.email || user?.email || "patient@example.com",
    amount: parseInt(amount) * 100, // Paystack amount is in kobo/pesewas
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "",
    currency: "GHS",
  };

  const initializePayment = usePaystackPayment(config);

  const triggerPayment = () => {
    setProcessing(true);
    initializePayment({
        onSuccess: (reference) => handlePaymentSuccess(reference),
        onClose: () => setProcessing(false),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 py-8">
      <div className="container max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" asChild>
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" />Back</Link>
          </Button>
          <ThemeSwitcher />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Payment Info */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Checkout</CardTitle>
                <CardDescription>Review your details and proceed to payment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Appointment Type:</span>
                      <span className="font-medium">{appointmentLabels[appointmentType]?.name}</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="text-lg font-semibold">Total Amount:</span>
                      <span className="text-2xl font-bold text-primary">{appointmentLabels[appointmentType]?.price}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <Lock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Secure Payment with Paystack</p>
                    <p className="text-sm text-muted-foreground">
                      Click below to securely proceed with Mobile Money or Debit Card.
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full h-12 text-lg"
                  onClick={triggerPayment}
                  disabled={processing || !patientData || !import.meta.env.VITE_PAYSTACK_PUBLIC_KEY}
                >
                  {processing ? "Processing..." : `Pay ${amount} GHS with Paystack`}
                </Button>
                {!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY && (
                    <p className="text-red-500 text-sm mt-2 text-center">Paystack Public Key is missing.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-medium">{appointmentLabels[appointmentType]?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{appointmentLabels[appointmentType]?.duration}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">{amount} GHS</span>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-primary">{amount} GHS</span>
                  </div>
                </div>

                <div className="pt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-success" />
                    <span>Instant confirmation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-success" />
                    <span>Email & SMS receipt</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
