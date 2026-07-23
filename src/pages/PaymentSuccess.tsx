import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Download, Calendar, Video, Loader2 } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { getPaymentValidity } from "@/lib/paymentValidity";
import jsPDF from "jspdf";

interface AppointmentDetails {
  id: string;
  scheduled_at: string;
  clinic: string;
  type: string;
  amount: string;
  doctorName: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  expiresAt: string | null; // ISO — 3-month payment expiry anchored to payment date
}

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const { user } = useAuth();
  const [details, setDetails] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!appointmentId || !user) {
        setLoading(false);
        return;
      }

      try {
        const userId = (user as any).uid || (user as any).id;

        // Fetch appointment
        const { data: appt } = await (supabase
          .from("appointments" as any)
          .select("*")
          .eq("id", appointmentId)
          .maybeSingle() as any);

        if (!appt) { setLoading(false); return; }

        // Fetch patient profile (from DB — primary source of truth)
        const { data: patient } = await (supabase
          .from("profiles" as any)
          .select("full_name, phone, email")
          .eq("id", userId)
          .maybeSingle() as any);

        // Fetch doctor profile
        let doctorName = "Your Doctor";
        if (appt.doctor_id) {
          const { data: doc } = await (supabase
            .from("profiles" as any)
            .select("full_name")
            .eq("id", appt.doctor_id)
            .maybeSingle() as any);
          if (doc) doctorName = `Dr. ${doc.full_name}`;
        }

        // Determine amount from specialty cost or type default
        const amount =
          searchParams.get("amount") ||
          (appt.type === "online" ? "150" : "200");

        // Payment expiry is anchored to the actual payment date (recorded on the
        // appointment), falling back to created_at for legacy bookings — never "now".
        const validity = getPaymentValidity(appt);

        setDetails({
          id: appt.id,
          scheduled_at: appt.scheduled_at,
          clinic: appt.clinic || "General",
          type: appt.type,
          amount,
          doctorName,
          patientName: patient?.full_name || "Patient",
          patientEmail: patient?.email || "",
          patientPhone: patient?.phone || "",
          expiresAt: validity.expiresAt ? validity.expiresAt.toISOString() : null,
        });
      } catch (err) {
        console.error("Error fetching appointment details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [appointmentId, user]);

  const handleDownloadReceipt = () => {
    if (!details) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // — Header —
    doc.setFillColor(41, 98, 160);
    doc.rect(0, 0, pageWidth, 38, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Gameliel Hospital", pageWidth / 2, 16, { align: "center" });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Payment Receipt", pageWidth / 2, 27, { align: "center" });

    // — Receipt ID & Date —
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    const receiptDate = format(new Date(), "MMMM do, yyyy – h:mm a");
    doc.text(`Receipt Date: ${receiptDate}`, 14, 52);
    doc.text(
      `Reference: #REC-${details.id.slice(0, 8).toUpperCase()}`,
      pageWidth - 14,
      52,
      { align: "right" }
    );

    // — Divider —
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 57, pageWidth - 14, 57);

    // — Patient Info —
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(41, 98, 160);
    doc.text("Patient Information", 14, 67);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    const apptDate = format(new Date(details.scheduled_at), "MMMM do, yyyy");
    const apptTime = format(new Date(details.scheduled_at), "h:mm a");

    const col1 = 14;
    const col2 = 80;
    const labelColor: [number, number, number] = [120, 120, 120];
    const valueColor: [number, number, number] = [30, 30, 30];

    const rows: [string, string, string, string][] = [
      ["Name:", details.patientName, "Phone:", details.patientPhone],
      ["Email:", details.patientEmail, "Doctor:", details.doctorName],
    ];

    let y = 76;
    rows.forEach(([l1, v1, l2, v2]) => {
      doc.setTextColor(...labelColor);
      doc.text(l1, col1, y);
      doc.setTextColor(...valueColor);
      doc.text(v1, col1 + 20, y);
      doc.setTextColor(...labelColor);
      doc.text(l2, col2 + 10, y);
      doc.setTextColor(...valueColor);
      doc.text(v2, col2 + 30, y);
      y += 9;
    });

    // — Appointment Info —
    doc.setFont("helvetica", "bold");
    doc.setTextColor(41, 98, 160);
    doc.setFontSize(11);
    y += 4;
    doc.text("Appointment Details", 14, y);
    y += 9;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const apptRows: [string, string, string, string][] = [
      ["Clinic:", details.clinic, "Type:", details.type.charAt(0).toUpperCase() + details.type.slice(1)],
      ["Date:", apptDate, "Time:", apptTime],
    ];
    apptRows.forEach(([l1, v1, l2, v2]) => {
      doc.setTextColor(...labelColor);
      doc.text(l1, col1, y);
      doc.setTextColor(...valueColor);
      doc.text(v1, col1 + 20, y);
      doc.setTextColor(...labelColor);
      doc.text(l2, col2 + 10, y);
      doc.setTextColor(...valueColor);
      doc.text(v2, col2 + 30, y);
      y += 9;
    });

    // — Payment Summary Box —
    y += 6;
    doc.setFillColor(240, 248, 255);
    doc.setDrawColor(41, 98, 160);
    doc.roundedRect(14, y, pageWidth - 28, 28, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text("Amount Paid", 22, y + 10);
    doc.setFontSize(18);
    doc.setTextColor(41, 98, 160);
    doc.text(`GHS ${details.amount}`, pageWidth - 22, y + 10, { align: "right" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Payment Status: PAID ✓", 22, y + 21);
    const expiryDate = details.expiresAt
      ? format(new Date(details.expiresAt), "MMMM do, yyyy")
      : "N/A";
    doc.text(`Valid Until: ${expiryDate}`, pageWidth - 22, y + 21, { align: "right" });

    // — Footer —
    const footerY = 270;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, footerY, pageWidth - 14, footerY);
    doc.setFontSize(8.5);
    doc.setTextColor(140, 140, 140);
    doc.text(
      "Gameliel Hospital · Tel: 0533-675-498 · www.gameliel.com",
      pageWidth / 2,
      footerY + 8,
      { align: "center" }
    );
    doc.text(
      `Thank you for booking. This payment is valid for 3 months and expires on ${expiryDate}.`,
      pageWidth / 2,
      footerY + 15,
      { align: "center" }
    );
    doc.text(
      "Please reschedule any missed appointment before this date to avoid forfeiting your payment.",
      pageWidth / 2,
      footerY + 21,
      { align: "center" }
    );

    doc.save(`receipt-${details.id.slice(0, 8)}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex items-center justify-center p-4">
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitcher />
      </div>
      <Card className="max-w-2xl w-full">
        <CardContent className="pt-12 pb-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Your appointment has been confirmed. A confirmation and SMS have been sent to you.
            </p>
          </div>

          {/* Appointment Details */}
          <div className="bg-muted p-6 rounded-lg space-y-3 text-left">
            <h3 className="font-semibold text-lg mb-4">Appointment Details</h3>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                <span className="text-muted-foreground text-sm">Loading details...</span>
              </div>
            ) : details ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Appointment ID</p>
                  <p className="font-medium">#{details.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{details.type} Consultation</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(details.scheduled_at), "MMMM do, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time</p>
                  <p className="font-medium">
                    {format(new Date(details.scheduled_at), "h:mm a")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Doctor</p>
                  <p className="font-medium">{details.doctorName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount Paid</p>
                  <p className="font-medium text-success">GHS {details.amount}</p>
                </div>
                <div className="col-span-2 mt-1 rounded-md bg-amber-500/10 border border-amber-500/20 p-3">
                  <p className="text-amber-700 dark:text-amber-400 text-xs">
                    This payment is valid for 3 months and expires on{" "}
                    <span className="font-semibold">
                      {details.expiresAt ? format(new Date(details.expiresAt), "MMMM do, yyyy") : "N/A"}
                    </span>
                    . Please reschedule any missed appointment before this date to avoid forfeiting your payment.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Appointment ID: #{appointmentId?.slice(0, 8).toUpperCase() || "—"}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDownloadReceipt}
              disabled={loading || !details}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Receipt (PDF)
            </Button>
            <Button variant="outline" className="flex-1" disabled>
              <Calendar className="w-4 h-4 mr-2" />
              Add to Calendar
            </Button>
          </div>

          <div className="pt-4 space-y-3">
            <Button asChild size="lg" className="w-full">
              <Link to="/dashboard/patient">
                <Video className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>

          <div className="pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              A video consultation link will be sent to you 15 minutes before your appointment.
              For any questions, contact us at{" "}
              <a href="tel:0533675498" className="text-primary hover:underline">
                0533-675-498
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
