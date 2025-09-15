import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import OnionLogo from "@/components/onion-logo";
import { Copy, CheckCircle, ExternalLink, AlertCircle, Code, Zap } from "lucide-react";
import { Link } from "wouter";

export default function TestIntegrationPage() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(window.location.origin);
  const [amount, setAmount] = useState("100");
  const [description, setDescription] = useState("Test Payment");
  const [customerEmail, setCustomerEmail] = useState("test@example.com");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [paymentResponse, setPaymentResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'setup' | 'testing' | 'result'>('setup');

  const testIntegration = async () => {
    if (!apiKey.trim() || !amount.trim() || !description.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in API key, amount, and description",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setStep('testing');

    try {
      const response = await fetch(`${baseUrl}/api/onionpay/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount) * 100, // Convert to paise
          description,
          customerEmail: customerEmail || undefined,
          callbackUrl: callbackUrl || undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPaymentResponse(data);
        setStep('result');
        toast({
          title: "Success!",
          description: "Payment initiated successfully"
        });
      } else {
        throw new Error(data.message || 'Failed to initiate payment');
      }
    } catch (error: any) {
      toast({
        title: "Integration Test Failed",
        description: error.message,
        variant: "destructive"
      });
      setStep('setup');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`
    });
  };

  const resetTest = () => {
    setStep('setup');
    setPaymentResponse(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <OnionLogo size={32} className="text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Test OnionPay Integration</h1>
          </div>
          <p className="text-lg text-gray-600 mb-6">
            Test your API integration before implementing in production
          </p>
          
          <div className="flex justify-center space-x-4">
            <Link href="/demo">
              <Button variant="outline" className="flex items-center space-x-2">
                <ExternalLink className="h-4 w-4" />
                <span>View Payment Demo</span>
              </Button>
            </Link>
            <Link href="/integration-docs">
              <Button variant="outline" className="flex items-center space-x-2">
                <Code className="h-4 w-4" />
                <span>Full Documentation</span>
              </Button>
            </Link>
          </div>
        </div>

        {step === 'setup' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left side - Test Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Test Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* API Configuration */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">API Configuration</h3>
                  
                  <div>
                    <Label htmlFor="baseUrl">Base URL</Label>
                    <Input
                      id="baseUrl"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://your-onionpay-instance.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="apiKey">API Key *</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your API key"
                    />
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                      <p className="text-xs text-yellow-800">
                        ⚠️ <strong>Security Warning:</strong> Only use test API keys here. 
                        For production, initiate payments server-side to keep keys secure.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Payment Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Payment Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount">Amount (₹) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="100.00"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="customerEmail">Customer Email</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="customer@example.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Test payment for integration"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="callbackUrl">Webhook URL (Optional)</Label>
                    <Input
                      id="callbackUrl"
                      type="url"
                      value={callbackUrl}
                      onChange={(e) => setCallbackUrl(e.target.value)}
                      placeholder="https://yoursite.com/webhook"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URL to receive payment status notifications
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={testIntegration} 
                  className="w-full"
                  disabled={isLoading || !apiKey.trim()}
                >
                  {isLoading ? "Testing Integration..." : "Test Integration"}
                </Button>
              </CardContent>
            </Card>

            {/* Right side - Instructions */}
            <div className="space-y-6">
              
              <Card>
                <CardHeader>
                  <CardTitle>How This Test Works</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-3">
                      <div className="bg-purple-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-purple-600 font-bold text-xs">1</span>
                      </div>
                      <p>Enter your API key and payment details</p>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-purple-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-purple-600 font-bold text-xs">2</span>
                      </div>
                      <p>We'll call the /api/onionpay/initiate endpoint</p>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-purple-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-purple-600 font-bold text-xs">3</span>
                      </div>
                      <p>You'll get a payment URL to redirect users to</p>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-purple-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-purple-600 font-bold text-xs">4</span>
                      </div>
                      <p>Test the actual payment flow</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Valid API key from dashboard</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Active QR code configuration</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Amount in valid format</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span>HTTPS required for production</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sample Integration Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                    <pre>{`// JavaScript Example
const payment = await fetch('/api/onionpay/initiate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 10000, // ₹100 in paise
    description: 'Product purchase'
  })
});

const data = await payment.json();
window.location.href = data.paymentUrl;`}</pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === 'testing' && (
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-6">
              <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Testing Integration...</h2>
              <p className="text-gray-600">Calling OnionPay API with your parameters</p>
            </CardContent>
          </Card>
        )}

        {step === 'result' && paymentResponse && (
          <div className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Integration Test Successful!</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div>
                    <h3 className="font-semibold mb-3">Payment Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order ID:</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {paymentResponse.orderId}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-semibold">₹{paymentResponse.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Description:</span>
                        <span>{paymentResponse.description}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expires At:</span>
                        <span className="text-xs">
                          {new Date(paymentResponse.expiresAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Next Steps</h3>
                    <div className="space-y-2 text-sm">
                      <p>• Redirect user to payment URL</p>
                      <p>• User scans QR and pays</p>
                      <p>• User submits UTR number</p>
                      <p>• Admin verifies payment</p>
                      <p>• Webhook sent to your server</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">JSON Response:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(paymentResponse, null, 2), 'API Response')}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
                  {JSON.stringify(paymentResponse, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => window.open(paymentResponse.paymentUrl, '_blank')}
                className="flex items-center space-x-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Test Payment Flow</span>
              </Button>
              
              <Button variant="outline" onClick={resetTest}>
                Test Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}