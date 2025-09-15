import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import OnionLogo from "@/components/onion-logo";
import { CheckCircle, Copy, Zap, DollarSign, Globe } from "lucide-react";
import { Link } from "wouter";

const amountExamples = [
  { input: 100, expected: "₹100.00", description: "Number input" },
  { input: "₹250", expected: "₹250.00", description: "Rupee symbol" },
  { input: "$50", expected: "₹50.00", description: "Dollar symbol (auto-converted)" },
  { input: "1,299.99", expected: "₹1,299.99", description: "With comma separator" },
  { input: "Rs 599", expected: "₹599.00", description: "Rs prefix" },
  { input: "Price: ₹2,499", expected: "₹2,499.00", description: "Text with price" },
  { input: "999.50 INR", expected: "₹999.50", description: "With currency suffix" },
];

const integrationExamples = [
  {
    title: "E-commerce Product Page",
    code: `// Auto-detect amount from product price
const productPrice = document.querySelector('.price').textContent; // "₹1,299"
const productName = document.querySelector('.product-title').textContent;

fetch('/api/onionpay/initiate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    priceText: productPrice,    // "₹1,299" - auto-detected
    itemName: productName,      // "Premium Headphones"
    description: 'Product purchase',
    customerEmail: 'customer@example.com'
  })
});`
  },
  {
    title: "Shopping Cart Integration",
    code: `// Auto-calculate total and create payment
const cartTotal = cart.items.reduce((total, item) => 
  total + (item.price * item.quantity), 0
);

fetch('/api/onionpay/initiate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: cartTotal,          // Auto-converts to paise
    itemName: \`\${cart.items.length} items\`,
    description: 'Shopping Cart Payment',
    customerEmail: user.email,
    // Enhanced metadata
    currency: 'INR'
  })
});`
  },
  {
    title: "Subscription/Service Payment",
    code: `// Service payment with flexible amount input
const planPrice = plan.price; // Can be "₹999/month" or 999
const planName = plan.name;

fetch('/api/onionpay/initiate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    priceText: planPrice,       // Flexible format
    itemName: planName,         // "Pro Plan"
    description: \`\${planName} subscription\`,
    customerEmail: user.email,
    callbackUrl: 'https://yoursite.com/subscription-activated'
  })
});`
  }
];

export default function AutoAmountDemo() {
  const { toast } = useToast();
  const [testAmount, setTestAmount] = useState("");
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testAmountParsing = async () => {
    if (!testAmount.trim()) return;
    
    setIsLoading(true);
    try {
      // Simulate the parsing logic (client-side simulation)
      const parseAmount = (input: string | number): { amount: number, formatted: string } => {
        let cleanInput = input;
        
        if (typeof input === 'string') {
          cleanInput = input
            .replace(/[₹$€£¥Rs,\s]/g, '')
            .replace(/\.(\d{3,})/g, '$1')
            .trim();
        }
        
        const parsed = parseFloat(cleanInput as string);
        if (isNaN(parsed) || parsed <= 0) {
          throw new Error('Invalid amount format');
        }
        
        return {
          amount: Math.round(parsed * 100), // paise
          formatted: `₹${parsed.toFixed(2)}`
        };
      };

      const result = parseAmount(testAmount);
      setParsedResult({
        original: testAmount,
        parsed: result.amount / 100,
        formatted: result.formatted,
        amountInPaise: result.amount,
        success: true
      });
      
      toast({
        title: "Amount Parsed Successfully!",
        description: `Detected: ${result.formatted}`
      });
    } catch (error: any) {
      setParsedResult({
        original: testAmount,
        error: error.message,
        success: false
      });
      
      toast({
        title: "Parsing Failed",
        description: error.message,
        variant: "destructive"
      });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <OnionLogo size={32} className="text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Auto Amount Detection Demo</h1>
          </div>
          <p className="text-lg text-gray-600 mb-6">
            OnionPay automatically detects and parses amounts from different formats
          </p>
          
          <div className="flex justify-center space-x-4 mb-8">
            <Link href="/integration-guide">
              <Button variant="outline" className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>Integration Guide</span>
              </Button>
            </Link>
            <Link href="/test-integration">
              <Button className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Test API</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Amount Parser */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Live Amount Parser</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Test how OnionPay automatically detects amounts from different formats
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Input Section */}
              <div>
                <Label htmlFor="test-amount">Test Amount Input</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    id="test-amount"
                    value={testAmount}
                    onChange={(e) => setTestAmount(e.target.value)}
                    placeholder="Enter amount in any format..."
                    className="flex-1"
                  />
                  <Button 
                    onClick={testAmountParsing}
                    disabled={isLoading || !testAmount.trim()}
                  >
                    {isLoading ? "Parsing..." : "Parse"}
                  </Button>
                </div>
                
                {/* Example Formats */}
                <div className="mt-4">
                  <h4 className="font-semibold mb-3">Try these formats:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {amountExamples.map((example, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setTestAmount(example.input.toString())}
                        className="justify-start text-left"
                      >
                        <code className="bg-gray-100 px-1 rounded text-xs mr-2">
                          {example.input}
                        </code>
                        <span className="text-xs text-gray-600">{example.description}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Result Section */}
              <div>
                <Label>Parsing Result</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  {parsedResult ? (
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        {parsedResult.success ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="font-semibold text-green-600">Successfully Parsed</span>
                          </>
                        ) : (
                          <>
                            <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                              <span className="text-white text-xs">!</span>
                            </div>
                            <span className="font-semibold text-red-600">Parsing Failed</span>
                          </>
                        )}
                      </div>
                      
                      {parsedResult.success ? (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Original:</span>
                            <code className="bg-gray-200 px-2 py-1 rounded">{parsedResult.original}</code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Detected:</span>
                            <span className="font-semibold text-green-600">{parsedResult.formatted}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">In Paise:</span>
                            <span className="font-mono">{parsedResult.amountInPaise}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-red-600">
                          <strong>Error:</strong> {parsedResult.error}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-8">
                      Enter an amount above and click "Parse" to see the result
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Examples */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Real-World Integration Examples</CardTitle>
            <p className="text-sm text-muted-foreground">
              See how different websites can integrate auto amount detection
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {integrationExamples.map((example, index) => (
                <div key={index} className="border-l-4 border-l-purple-500 pl-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-lg">{example.title}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(example.code, example.title)}
                      className="flex items-center space-x-1"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </Button>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{example.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Auto Amount Detection Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <h4 className="font-semibold mb-3 text-green-600">✅ Supported Formats:</h4>
                <ul className="text-sm space-y-2">
                  <li>• Number input: <code>100</code>, <code>299.99</code></li>
                  <li>• Currency symbols: <code>₹100</code>, <code>$50</code></li>
                  <li>• With separators: <code>1,299.99</code>, <code>2,499</code></li>
                  <li>• Text with price: <code>"Price: ₹999"</code></li>
                  <li>• Currency suffixes: <code>"100 INR"</code></li>
                  <li>• Regional formats: <code>"Rs 599"</code></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 text-blue-600">🚀 Additional Features:</h4>
                <ul className="text-sm space-y-2">
                  <li>• Automatic currency conversion to INR</li>
                  <li>• Range validation (₹1 to ₹1,00,000)</li>
                  <li>• Enhanced descriptions with item names</li>
                  <li>• Integration metadata for tracking</li>
                  <li>• Support for product-based pricing</li>
                  <li>• Multiple input fields (amount, priceText)</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">💡 Smart Integration:</h4>
              <p className="text-sm text-purple-700">
                OnionPay's auto amount detection makes integration seamless. Simply pass your website's 
                price information in any format, and OnionPay will automatically parse, validate, and 
                display it correctly to users. Perfect for e-commerce, subscriptions, and service payments!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}