import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import OnionLogo from "@/components/onion-logo";
import { Copy, CheckCircle, ExternalLink, Code, Zap, Shield, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const codeExamples = {
  javascript: {
    basic: `// Basic JavaScript integration
async function initiatePayment() {
  const response = await fetch('YOUR_ONIONPAY_URL/api/onionpay/initiate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify({
      amount: 10000, // Amount in paise (₹100)
      description: 'Product purchase',
      customerEmail: 'customer@example.com',
      callbackUrl: 'https://yoursite.com/payment-callback'
    })
  });
  
  const paymentData = await response.json();
  
  // Redirect user to payment page
  window.location.href = paymentData.paymentUrl;
}

// Check payment status
async function checkPaymentStatus(orderId) {
  const response = await fetch(\`YOUR_ONIONPAY_URL/api/onionpay/status/\${orderId}\`);
  const status = await response.json();
  return status;
}`,
    
    react: `// React component for payment integration
import { useState } from 'react';

function PaymentButton({ amount, description, onSuccess }) {
  const [loading, setLoading] = useState(false);
  
  const initiatePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/onionpay/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_API_KEY'
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to paise
          description,
          customerEmail: 'customer@example.com',
          callbackUrl: window.location.origin + '/payment-success'
        })
      });
      
      const paymentData = await response.json();
      
      // Redirect to payment page
      window.location.href = paymentData.paymentUrl;
    } catch (error) {
      console.error('Payment initiation failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button 
      onClick={initiatePayment}
      disabled={loading}
      className="bg-purple-600 text-white px-6 py-3 rounded-lg"
    >
      {loading ? 'Processing...' : \`Pay ₹\${amount}\`}
    </button>
  );
}`,
    
    php: `<?php
// PHP integration example
class OnionPayGateway {
    private $apiKey;
    private $baseUrl;
    
    public function __construct($apiKey, $baseUrl) {
        $this->apiKey = $apiKey;
        $this->baseUrl = $baseUrl;
    }
    
    public function initiatePayment($amount, $description, $customerEmail = null, $callbackUrl = null) {
        $data = [
            'amount' => $amount * 100, // Convert to paise
            'description' => $description,
            'customerEmail' => $customerEmail,
            'callbackUrl' => $callbackUrl
        ];
        
        $response = $this->makeRequest('/api/onionpay/initiate', $data);
        return $response;
    }
    
    public function checkPaymentStatus($orderId) {
        $url = $this->baseUrl . '/api/onionpay/status/' . $orderId;
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true);
    }
    
    private function makeRequest($endpoint, $data) {
        $url = $this->baseUrl . $endpoint;
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->apiKey
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true);
    }
}

// Usage
$gateway = new OnionPayGateway('YOUR_API_KEY', 'YOUR_ONIONPAY_URL');
$payment = $gateway->initiatePayment(100, 'Product purchase', 'customer@example.com');

// Redirect user
header('Location: ' . $payment['paymentUrl']);
?>`,

    webhook: `// Webhook handler with security (Node.js/Express)
const crypto = require('crypto');

app.post('/payment-webhook', express.raw({type: 'application/json'}), (req, res) => {
  const payload = req.body;
  const signature = req.headers['x-onionpay-signature'];
  const timestamp = req.headers['x-onionpay-timestamp'];
  
  // Verify webhook authenticity
  if (!verifyWebhookSignature(payload, signature, timestamp)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const data = JSON.parse(payload);
  const { orderId, status, amount, timestamp: eventTime } = data;
  
  switch (status) {
    case 'approved':
      // Payment successful - fulfill order
      console.log(\`Payment approved for order \${orderId}, amount: ₹\${amount/100}\`);
      // Update your database, send confirmation email, etc.
      break;
      
    case 'failed':
      // Payment failed - handle accordingly
      console.log(\`Payment failed for order \${orderId}\`);
      break;
      
    case 'expired':
      // Payment expired - handle timeout
      console.log(\`Payment expired for order \${orderId}\`);
      break;
  }
  
  res.json({ received: true });
});

// PHP Webhook Handler
<?php
$payload = file_get_contents('php://input');
$data = json_decode($payload, true);

switch ($data['status']) {
    case 'approved':
        // Handle successful payment
        updateOrderStatus($data['orderId'], 'completed');
        sendConfirmationEmail($data['orderId']);
        break;
        
    case 'failed':
        // Handle failed payment
        updateOrderStatus($data['orderId'], 'failed');
        break;
        
    case 'expired':
        // Handle expired payment
        updateOrderStatus($data['orderId'], 'expired');
        break;
}

http_response_code(200);
echo json_encode(['received' => true]);

// Webhook signature verification function
function verifyWebhookSignature($payload, $signature, $timestamp, $secret) {
    // Check timestamp (prevent replay attacks)
    if (abs(time() - $timestamp) > 300) { // 5 minutes tolerance
        return false;
    }
    
    // Verify HMAC-SHA256 signature
    $expectedSignature = hash_hmac('sha256', $timestamp . '.' . $payload, $secret);
    return hash_equals('sha256=' . $expectedSignature, $signature);
}
?>

// Node.js signature verification
function verifyWebhookSignature(payload, signature, timestamp) {
  const webhookSecret = process.env.ONIONPAY_WEBHOOK_SECRET;
  
  // Check timestamp (prevent replay attacks)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
    return false;
  }
  
  // Verify HMAC-SHA256 signature
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(timestamp + '.' + payload)
    .digest('hex');
    
  return signature === 'sha256=' + expectedSignature;
}`
  }
};

export default function IntegrationDocs() {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const features = [
    { icon: Zap, title: "Fast Integration", description: "Get started in minutes with simple API calls" },
    { icon: Shield, title: "Secure Payments", description: "Bank-grade security with manual verification" },
    { icon: Globe, title: "UPI Support", description: "Accept payments from all UPI apps in India" },
    { icon: Code, title: "Developer Friendly", description: "Clean APIs with comprehensive documentation" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <OnionLogo size={32} className="text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">OnionPay Integration</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8">
            Secure UPI payment gateway for your website or application
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <feature.icon className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Start */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Quick Start Guide</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Get API Key</h3>
                <p className="text-sm text-gray-600">Generate your API key from the dashboard</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Integrate API</h3>
                <p className="text-sm text-gray-600">Call our simple REST API to initiate payments</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Handle Callbacks</h3>
                <p className="text-sm text-gray-600">Receive payment confirmations via webhooks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Reference */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Complete API Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-800 mb-2">Base URL Format:</h4>
              <code className="text-blue-700">https://your-onionpay-instance.replit.app</code>
              <p className="text-sm text-blue-600 mt-2">Replace with your actual OnionPay deployment URL</p>
            </div>
            
            <div className="space-y-8">
              
              {/* Initiate Payment */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">POST</Badge>
                  <code className="bg-gray-100 px-2 py-1 rounded">/api/onionpay/initiate</code>
                </div>
                <p className="text-gray-600 mb-3">Create a new payment order</p>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Headers:</h4>
                  <div className="space-y-1 text-sm">
                    <div><code>Authorization: Bearer YOUR_API_KEY</code></div>
                    <div><code>Content-Type: application/json</code></div>
                  </div>
                  
                  <h4 className="font-semibold mb-2 mt-4">Request Body:</h4>
                  <pre className="text-sm overflow-x-auto">
{`{
  "amount": 10000,                    // Amount in paise (₹100)
  "description": "Product purchase",   // Payment description
  "customerEmail": "user@example.com", // Optional
  "callbackUrl": "https://yoursite.com/webhook", // Optional
  "productId": "prod_123"             // Optional, if using products
}`}
                  </pre>
                  
                  <h4 className="font-semibold mb-2 mt-4">Response:</h4>
                  <pre className="text-sm overflow-x-auto">
{`{
  "orderId": "ORDER_123456",
  "amount": 100,
  "description": "Product purchase",
  "qrCodeUrl": "/uploads/qr-123.png",
  "upiId": "merchant@upi",
  "expiresAt": "2024-01-01T10:35:00Z",
  "paymentUrl": "https://gateway.com/payment/ORDER_123456"
}`}
                  </pre>
                </div>
              </div>

              <Separator />

              {/* Check Status */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">GET</Badge>
                  <code className="bg-gray-100 px-2 py-1 rounded">/api/onionpay/status/:orderId</code>
                </div>
                <p className="text-gray-600 mb-3">Check payment status</p>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Response:</h4>
                  <pre className="text-sm overflow-x-auto">
{`{
  "status": "pending", // pending, approved, failed, expired
  "orderId": "ORDER_123456",
  "amount": 10000,
  "updatedAt": "2024-01-01T10:30:00Z"
}`}
                  </pre>
                </div>
              </div>

              <Separator />

              {/* Submit UTR */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">POST</Badge>
                  <code className="bg-gray-100 px-2 py-1 rounded">/api/onionpay/submit</code>
                </div>
                <p className="text-gray-600 mb-3">Submit UTR after payment (called by payment page)</p>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Request Body:</h4>
                  <pre className="text-sm overflow-x-auto">
{`{
  "orderId": "ORDER_123456",
  "utr": "123456789012"
}`}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Code Examples */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Integration Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="javascript" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="react">React</TabsTrigger>
                <TabsTrigger value="php">PHP</TabsTrigger>
                <TabsTrigger value="webhook">Webhooks</TabsTrigger>
              </TabsList>
              
              {Object.entries(codeExamples).map(([key, examples]) => (
                <TabsContent key={key} value={key} className="space-y-4">
                  {Object.entries(examples).map(([exampleKey, code]) => (
                    <div key={exampleKey} className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold capitalize">{exampleKey.replace('_', ' ')}</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(code, `${key} ${exampleKey}`)}
                          className="flex items-center space-x-1"
                        >
                          {copiedCode === `${key} ${exampleKey}` ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          <span>Copy</span>
                        </Button>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{code}</code>
                      </pre>
                    </div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Payment Flow */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Payment Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 font-bold text-xs">1</span>
                </div>
                <div>
                  <h4 className="font-semibold">Initiate Payment</h4>
                  <p className="text-gray-600 text-sm">Your server calls <code>/api/onionpay/initiate</code> with payment details</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 font-bold text-xs">2</span>
                </div>
                <div>
                  <h4 className="font-semibold">Redirect to Payment Page</h4>
                  <p className="text-gray-600 text-sm">User is redirected to OnionPay's secure payment page</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 font-bold text-xs">3</span>
                </div>
                <div>
                  <h4 className="font-semibold">User Pays via UPI</h4>
                  <p className="text-gray-600 text-sm">User scans QR code and makes payment through any UPI app</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 font-bold text-xs">4</span>
                </div>
                <div>
                  <h4 className="font-semibold">Submit UTR</h4>
                  <p className="text-gray-600 text-sm">User enters UTR number as payment proof</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 font-bold text-xs">5</span>
                </div>
                <div>
                  <h4 className="font-semibold">Admin Verification</h4>
                  <p className="text-gray-600 text-sm">Payment appears in admin dashboard for manual verification</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 font-bold text-xs">6</span>
                </div>
                <div>
                  <h4 className="font-semibold">Webhook Notification</h4>
                  <p className="text-gray-600 text-sm">Your server receives webhook notification when payment is approved/rejected</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Testing & Demo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Test the payment flow with our demo page to see exactly what your customers will experience.
              </p>
              
              <div className="flex space-x-4">
                <Button className="flex items-center space-x-2">
                  <ExternalLink className="h-4 w-4" />
                  <span>Try Demo Payment</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Code className="h-4 w-4" />
                  <span>API Playground</span>
                </Button>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Development Tips:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Use test amounts (₹1-10) during development</li>
                  <li>• Always handle webhook timeouts and retries</li>
                  <li>• Store order IDs in your database for tracking</li>
                  <li>• Implement proper error handling for failed payments</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}