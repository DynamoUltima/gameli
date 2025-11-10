import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Download, Calendar, Video } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const PaymentSuccess = () => {
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
              Your appointment has been confirmed. A confirmation email has been sent to your inbox.
            </p>
          </div>

          <div className="bg-muted p-6 rounded-lg space-y-3 text-left">
            <h3 className="font-semibold text-lg mb-4">Appointment Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Appointment ID</p>
                <p className="font-medium">#APT-2025-0001</p>
              </div>
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium">Online Consultation</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">January 30, 2025</p>
              </div>
              <div>
                <p className="text-muted-foreground">Time</p>
                <p className="font-medium">10:00 AM</p>
              </div>
              <div>
                <p className="text-muted-foreground">Doctor</p>
                <p className="font-medium">Dr. Sarah Smith</p>
              </div>
              <div>
                <p className="text-muted-foreground">Amount Paid</p>
                <p className="font-medium text-success">45 GHS</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download Receipt
            </Button>
            <Button variant="outline" className="flex-1">
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
              <a href="tel:+233XXXXXXXXX" className="text-primary hover:underline">
                +233 XX XXX XXXX
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
