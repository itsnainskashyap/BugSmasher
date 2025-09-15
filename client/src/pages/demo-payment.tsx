import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import OnionLogo from "@/components/onion-logo";
import { CheckCircle, XCircle, ArrowLeft, Eye, Code } from "lucide-react";
import { Link } from "wouter";

export default function DemoPaymentPage() {
  const [utr, setUtr] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'submitted' | 'approved' | 'failed'>('pending');
  const [showPreview, setShowPreview] = useState(true);

  // Demo countdown timer
  useEffect(() => {
    if (paymentStatus !== 'pending') return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentStatus]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr.trim()) return;
    
    setPaymentStatus('submitted');
    
    // Simulate admin approval after 3 seconds
    setTimeout(() => {
      setPaymentStatus('approved');
    }, 3000);
  };

  const resetDemo = () => {
    setUtr("");
    setTimeLeft(300);
    setPaymentStatus('pending');
  };

  if (!showPreview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Preview</span>
            </Button>
            
            <h1 className="text-2xl font-bold">Integration Code</h1>
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Sample Integration Code:</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`// Step 1: Initialize payment on your server
app.post('/create-payment', async (req, res) => {
  const response = await fetch('YOUR_ONIONPAY_URL/api/onionpay/initiate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify({
      amount: 25000, // ₹250 in paise
      description: 'Premium Plan Subscription',
      customerEmail: req.body.email,
      callbackUrl: 'https://yoursite.com/payment-webhook'
    })
  });
  
  const paymentData = await response.json();
  res.json({ paymentUrl: paymentData.paymentUrl });
});

// Step 2: Redirect user to payment page
function buyPremiumPlan() {
  fetch('/create-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com' })
  })
  .then(res => res.json())
  .then(data => {
    window.location.href = data.paymentUrl;
  });
}

// Step 3: Handle webhook on your server
app.post('/payment-webhook', (req, res) => {
  const { orderId, status, amount } = req.body;
  
  if (status === 'approved') {
    // Activate premium plan for user
    upgradeUserToPremium(orderId);
    sendConfirmationEmail(orderId);
  }
  
  res.json({ received: true });
});`}
              </pre>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Integration Benefits:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>✅ No complex payment processing setup required</li>
                  <li>✅ Secure UPI payments with manual verification</li>
                  <li>✅ Real-time webhook notifications</li>
                  <li>✅ Professional payment interface</li>
                  <li>✅ 5-minute payment window with countdown</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <OnionLogo size={32} className="text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">OnionPay Demo</h1>
          </div>
          <p className="text-lg text-gray-600 mb-6">
            यह दिखाता है कि आपके customers को payment करते समय कैसा interface दिखेगा
          </p>
          
          <div className="flex justify-center space-x-4 mb-8">
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              className="flex items-center space-x-2"
            >
              <Code className="h-4 w-4" />
              <span>View Integration Code</span>
            </Button>
            <Button
              onClick={resetDemo}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <span>Reset Demo</span>
            </Button>
            <Link href="/integration-docs">
              <Button className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>Full Documentation</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left side - Demo explanation */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Demo Scenario</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-purple-100 text-purple-800">Product</Badge>
                    <span>Premium Plan Subscription</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-green-100 text-green-800">Amount</Badge>
                    <span>₹250.00</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-blue-100 text-blue-800">Status</Badge>
                    <span className="capitalize">{paymentStatus}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Payment Flow Steps</h3>
                <div className="space-y-3">
                  <div className={`flex items-center space-x-3 ${paymentStatus === 'pending' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className="w-2 h-2 rounded-full bg-current"></div>
                    <span>1. User scans QR code</span>
                  </div>
                  <div className={`flex items-center space-x-3 ${paymentStatus === 'pending' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className="w-2 h-2 rounded-full bg-current"></div>
                    <span>2. Makes UPI payment</span>
                  </div>
                  <div className={`flex items-center space-x-3 ${paymentStatus === 'submitted' || paymentStatus === 'approved' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className="w-2 h-2 rounded-full bg-current"></div>
                    <span>3. Enters UTR number</span>
                  </div>
                  <div className={`flex items-center space-x-3 ${paymentStatus === 'approved' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className="w-2 h-2 rounded-full bg-current"></div>
                    <span>4. Admin verifies payment</span>
                  </div>
                  <div className={`flex items-center space-x-3 ${paymentStatus === 'approved' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className="w-2 h-2 rounded-full bg-current"></div>
                    <span>5. Webhook sent to your server</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Try This Demo</h3>
                <div className="space-y-3 text-sm">
                  <p>• The QR code is a placeholder in this demo</p>
                  <p>• Enter any 12-digit number as UTR to test</p>
                  <p>• Payment will be "approved" automatically after 3 seconds</p>
                  <p>• In real integration, admin manually verifies payments</p>
                  <p>• Timer shows 5-minute payment window</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Payment interface preview */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <Card className="shadow-xl border border-border overflow-hidden">
                {/* Header */}
                <div className="bg-primary text-primary-foreground p-6 text-center">
                  <div className="flex justify-center items-center space-x-2 mb-2">
                    <OnionLogo size={24} className="text-white" />
                    <h1 className="text-xl font-bold">OnionPay</h1>
                  </div>
                  <p className="text-sm opacity-90">Secure Payment Gateway</p>
                </div>

                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Premium Plan Subscription
                    </h3>
                    <div className="text-3xl font-bold text-primary mb-4">
                      ₹250.00
                    </div>

                    {paymentStatus === 'pending' && timeLeft > 0 && (
                      <div className="bg-muted/30 rounded-lg p-4 mb-4">
                        <div className="text-sm text-muted-foreground mb-2">Payment expires in:</div>
                        <div 
                          className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-foreground'}`}
                        >
                          {formatTime(timeLeft)}
                        </div>
                        <div className="w-full bg-border rounded-full h-2 mt-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${(timeLeft / 300) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {paymentStatus === 'pending' && timeLeft > 0 && (
                      <>
                        <div className="mb-6">
                          <p className="text-sm text-muted-foreground mb-4">
                            Scan QR code and pay exactly ₹250.00
                          </p>
                          <div className="w-48 h-48 mx-auto bg-muted border border-border rounded-md flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-32 h-32 bg-black mx-auto mb-2 rounded-lg flex items-center justify-center">
                                <div className="grid grid-cols-3 gap-1">
                                  {Array.from({ length: 9 }).map((_, i) => (
                                    <div key={i} className={`w-2 h-2 ${Math.random() > 0.5 ? 'bg-white' : 'bg-black'}`}></div>
                                  ))}
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">UPI QR Code</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">merchant@paytm</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="utr" className="block text-sm font-medium text-foreground mb-2">
                              Enter UTR Number
                            </Label>
                            <Input
                              id="utr"
                              type="text"
                              value={utr}
                              onChange={(e) => setUtr(e.target.value.toUpperCase())}
                              placeholder="Enter 12-digit UTR"
                              maxLength={20}
                              className="w-full"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Demo: Enter any 12-digit number
                            </p>
                          </div>

                          <Button 
                            type="submit" 
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-lg"
                            disabled={!utr.trim() || utr.length < 8}
                          >
                            Submit Payment Proof
                          </Button>
                        </form>
                      </>
                    )}

                    {paymentStatus === 'submitted' && (
                      <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-purple-600 mb-2">
                          Verifying Payment...
                        </h2>
                        <p className="text-muted-foreground">Please wait while we verify your payment</p>
                      </div>
                    )}

                    {paymentStatus === 'approved' && (
                      <div className="text-center">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-green-600 mb-2">
                          Payment Approved!
                        </h2>
                        <p className="text-muted-foreground">Your payment has been confirmed.</p>
                        <div className="mt-4 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-700">
                            ✅ Premium Plan activated<br/>
                            📧 Confirmation email sent<br/>
                            🎉 Welcome to Premium!
                          </p>
                        </div>
                      </div>
                    )}

                    {paymentStatus === 'failed' && (
                      <div className="text-center">
                        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-red-600 mb-2">
                          Payment Failed
                        </h2>
                        <p className="text-muted-foreground">Your payment was not approved.</p>
                      </div>
                    )}

                    {paymentStatus === 'pending' && timeLeft <= 0 && (
                      <div className="text-center">
                        <XCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-orange-600 mb-2">
                          Payment Expired
                        </h2>
                        <p className="text-muted-foreground">The payment window has closed.</p>
                      </div>
                    )}

                    <div className="mt-4 text-xs text-muted-foreground">
                      <p>Order ID: <span className="font-mono">DEMO_ORDER_12345</span></p>
                      <p>Secured by OnionPay • Your payment is protected</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}