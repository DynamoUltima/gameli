import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, CreditCard, Smartphone, Lock, Check } from "lucide-react";
import { toast } from "sonner";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const Payment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get("amount") || "45";
  const [paymentMethod, setPaymentMethod] = useState("momo");
  const [processing, setProcessing] = useState(false);

  const [momoData, setMomoData] = useState({
    provider: "mtn",
    phone: ""
  });

  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: ""
  });

  const handlePayment = () => {
    setProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      toast.success("Payment successful!");
      navigate("/payment-success");
    }, 2000);
  };

  const appointmentType = searchParams.get("type") || "online";
  const appointmentLabels: { [key: string]: { name: string; price: string } } = {
    online: { name: "Online Consultation (45 minutes)", price: "45 GHS" },
    hospital: { name: "Hospital Visit", price: amount === "144" ? "144 GHS (First Visit)" : "104 GHS (Follow-up)" },
    home: { name: "Home Visit", price: `${amount} GHS` }
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
          {/* Payment Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>Choose your preferred payment method</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Appointment Type & Price Label */}
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
                {/* Payment Method Selection */}
                <div className="space-y-3">
                  <Label>Select Payment Method</Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary transition-colors">
                      <RadioGroupItem value="momo" id="momo-payment" />
                      <Label htmlFor="momo-payment" className="flex items-center gap-3 flex-1 cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                          <Smartphone className="w-6 h-6 text-warning" />
                        </div>
                        <div>
                          <p className="font-medium">Mobile Money</p>
                          <p className="text-sm text-muted-foreground">MTN, Vodafone, AirtelTigo</p>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary transition-colors">
                      <RadioGroupItem value="card" id="card-payment" />
                      <Label htmlFor="card-payment" className="flex items-center gap-3 flex-1 cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Debit Card</p>
                          <p className="text-sm text-muted-foreground">Visa, MasterCard</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Mobile Money Form */}
                {paymentMethod === "momo" && (
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="provider">Mobile Money Provider</Label>
                      <RadioGroup value={momoData.provider} onValueChange={(value) => setMomoData({...momoData, provider: value})}>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:border-primary">
                            <RadioGroupItem value="mtn" id="mtn" />
                            <Label htmlFor="mtn" className="cursor-pointer font-normal">MTN</Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:border-primary">
                            <RadioGroupItem value="vodafone" id="vodafone" />
                            <Label htmlFor="vodafone" className="cursor-pointer font-normal">Vodafone</Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:border-primary">
                            <RadioGroupItem value="airteltigo" id="airteltigo" />
                            <Label htmlFor="airteltigo" className="cursor-pointer font-normal">AirtelTigo</Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="momo-phone">Mobile Money Number</Label>
                      <Input 
                        id="momo-phone"
                        placeholder="0XX XXX XXXX"
                        value={momoData.phone}
                        onChange={(e) => setMomoData({...momoData, phone: e.target.value})}
                      />
                      <p className="text-sm text-muted-foreground">
                        You'll receive a prompt on your phone to authorize the payment
                      </p>
                    </div>
                  </div>
                )}

                {/* Card Payment Form */}
                {paymentMethod === "card" && (
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="card-number">Card Number</Label>
                      <Input 
                        id="card-number"
                        placeholder="1234 5678 9012 3456"
                        value={cardData.number}
                        onChange={(e) => setCardData({...cardData, number: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="card-name">Cardholder Name</Label>
                      <Input 
                        id="card-name"
                        placeholder="John Doe"
                        value={cardData.name}
                        onChange={(e) => setCardData({...cardData, name: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input 
                          id="expiry"
                          placeholder="MM/YY"
                          value={cardData.expiry}
                          onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input 
                          id="cvv"
                          placeholder="123"
                          type="password"
                          maxLength={3}
                          value={cardData.cvv}
                          onChange={(e) => setCardData({...cardData, cvv: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Notice */}
                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <Lock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Secure Payment</p>
                    <p className="text-sm text-muted-foreground">
                      Your payment information is encrypted and secure. We never store your card details.
                    </p>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handlePayment}
                  disabled={processing}
                >
                  {processing ? "Processing..." : `Pay ${amount} GHS`}
                  {!processing && <Check className="w-4 h-4 ml-2" />}
                </Button>
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
                    <span className="font-medium">Online Consultation</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">45 minutes</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Consultation Fee:</span>
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
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-success" />
                    <span>Video call link sent</span>
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
