import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, CheckCircle, ExternalLink, AlertTriangle, Code, Globe, Settings, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import OnionLogo from "@/components/onion-logo";
import { Link } from "wouter";

const integrationSteps = {
  html: {
    title: "HTML/JavaScript Website",
    steps: [
      {
        step: 1,
        title: "Get Your API Key",
        description: "Login to your OnionPay dashboard and generate an API key",
        code: `// Save this API key securely on your server
const ONIONPAY_API_KEY = "op_test_1234567890abcdef";
const ONIONPAY_BASE_URL = "https://your-onionpay-instance.replit.app";`
      },
      {
        step: 2,
        title: "Create Payment Button",
        description: "Add a payment button to your website",
        code: `<button id="pay-now-btn" onclick="initiatePayment()" class="pay-btn">
  Pay ₹<span id="amount">100</span>
</button>

<style>
.pay-btn {
  background: #6A1B9A;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}
</style>`
      },
      {
        step: 3,
        title: "Implement Payment Function",
        description: "Add JavaScript to handle payment initiation",
        code: `async function initiatePayment() {
  const amount = document.getElementById('amount').textContent;
  
  try {
    // Call your server endpoint
    const response = await fetch('/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: parseFloat(amount),
        description: 'Product Purchase',
        customerEmail: 'customer@example.com'
      })
    });
    
    const data = await response.json();
    
    if (data.paymentUrl) {
      // Redirect to OnionPay
      window.location.href = data.paymentUrl;
    } else {
      alert('Payment initiation failed');
    }
  } catch (error) {
    console.error('Payment error:', error);
    alert('Payment failed. Please try again.');
  }
}`
      },
      {
        step: 4,
        title: "Server-Side Payment Creation",
        description: "Create payment endpoint on your server (Node.js/Express example)",
        code: `// server.js
app.post('/create-payment', async (req, res) => {
  const { amount, description, customerEmail } = req.body;
  
  try {
    const response = await fetch(\`\${ONIONPAY_BASE_URL}/api/onionpay/initiate\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${ONIONPAY_API_KEY}\`
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to paise
        description: description,
        customerEmail: customerEmail,
        callbackUrl: 'https://yoursite.com/payment-webhook'
      })
    });
    
    const paymentData = await response.json();
    
    if (response.ok) {
      // Store payment info in your database
      await savePaymentRecord({
        orderId: paymentData.orderId,
        amount: amount,
        status: 'pending',
        userId: req.user?.id
      });
      
      res.json({ paymentUrl: paymentData.paymentUrl });
    } else {
      res.status(400).json({ error: paymentData.message });
    }
  } catch (error) {
    console.error('Payment creation failed:', error);
    res.status(500).json({ error: 'Payment creation failed' });
  }
});`
      },
      {
        step: 5,
        title: "Handle Payment Confirmation",
        description: "Set up webhook to receive payment confirmations",
        code: `// Webhook endpoint
app.post('/payment-webhook', express.json(), async (req, res) => {
  const { orderId, status, amount, timestamp } = req.body;
  
  // Verify webhook signature (recommended)
  if (!verifyWebhookSignature(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  try {
    // Update payment status in your database
    await updatePaymentStatus(orderId, status);
    
    if (status === 'approved') {
      // Payment successful - fulfill order
      await fulfillOrder(orderId);
      await sendConfirmationEmail(orderId);
      
      console.log(\`Payment approved: \${orderId} - ₹\${amount/100}\`);
    } else if (status === 'failed') {
      // Handle failed payment
      await handleFailedPayment(orderId);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});`
      }
    ]
  },
  
  wordpress: {
    title: "WordPress Website",
    steps: [
      {
        step: 1,
        title: "Install OnionPay Plugin",
        description: "Add OnionPay integration to your WordPress site",
        code: `<?php
// Add to functions.php or create a plugin file
function onionpay_init() {
  // Add OnionPay settings page
  add_action('admin_menu', 'onionpay_admin_menu');
  
  // Add payment shortcode
  add_shortcode('onionpay_button', 'onionpay_button_shortcode');
}
add_action('init', 'onionpay_init');

// Admin menu
function onionpay_admin_menu() {
  add_options_page(
    'OnionPay Settings',
    'OnionPay',
    'manage_options',
    'onionpay-settings',
    'onionpay_settings_page'
  );
}
?>`
      },
      {
        step: 2,
        title: "Add Settings Page",
        description: "Create configuration page for API keys",
        code: `<?php
function onionpay_settings_page() {
  if (isset($_POST['submit'])) {
    update_option('onionpay_api_key', sanitize_text_field($_POST['api_key']));
    update_option('onionpay_base_url', esc_url_raw($_POST['base_url']));
    echo '<div class="notice notice-success"><p>Settings saved!</p></div>';
  }
  
  $api_key = get_option('onionpay_api_key', '');
  $base_url = get_option('onionpay_base_url', '');
?>
<div class="wrap">
  <h1>OnionPay Settings</h1>
  <form method="post">
    <table class="form-table">
      <tr>
        <th>API Key</th>
        <td><input type="text" name="api_key" value="<?php echo esc_attr($api_key); ?>" class="regular-text" /></td>
      </tr>
      <tr>
        <th>Base URL</th>
        <td><input type="url" name="base_url" value="<?php echo esc_attr($base_url); ?>" class="regular-text" /></td>
      </tr>
    </table>
    <?php submit_button(); ?>
  </form>
</div>
<?php
}
?>`
      },
      {
        step: 3,
        title: "Create Payment Shortcode",
        description: "Add shortcode for payment buttons",
        code: `<?php
function onionpay_button_shortcode($atts) {
  $atts = shortcode_atts([
    'amount' => '100',
    'description' => 'Payment',
    'text' => 'Pay Now'
  ], $atts);
  
  $amount = floatval($atts['amount']);
  $description = sanitize_text_field($atts['description']);
  $text = sanitize_text_field($atts['text']);
  
  ob_start();
?>
<div class="onionpay-button-container">
  <button 
    class="onionpay-btn" 
    data-amount="<?php echo $amount; ?>"
    data-description="<?php echo esc_attr($description); ?>"
    onclick="onionPayInitiate(this)"
  >
    <?php echo esc_html($text); ?> ₹<?php echo $amount; ?>
  </button>
</div>

<style>
.onionpay-btn {
  background: #6A1B9A;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}
.onionpay-btn:hover {
  background: #5A1A8A;
}
</style>

<script>
function onionPayInitiate(btn) {
  const amount = btn.dataset.amount;
  const description = btn.dataset.description;
  
  // Show loading state
  btn.innerHTML = 'Processing...';
  btn.disabled = true;
  
  // Make AJAX request
  fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      action: 'onionpay_create_payment',
      amount: amount,
      description: description,
      nonce: '<?php echo wp_create_nonce('onionpay_nonce'); ?>'
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success && data.data.paymentUrl) {
      window.location.href = data.data.paymentUrl;
    } else {
      alert('Payment initiation failed: ' + (data.data.message || 'Unknown error'));
      btn.innerHTML = '<?php echo esc_js($text); ?> ₹<?php echo $amount; ?>';
      btn.disabled = false;
    }
  })
  .catch(error => {
    console.error('Payment error:', error);
    alert('Payment failed. Please try again.');
    btn.innerHTML = '<?php echo esc_js($text); ?> ₹<?php echo $amount; ?>';
    btn.disabled = false;
  });
}
</script>
<?php
  return ob_get_clean();
}
?>`
      }
    ]
  },
  
  shopify: {
    title: "Shopify Store",
    steps: [
      {
        step: 1,
        title: "Create Custom App",
        description: "Set up OnionPay as a custom payment method",
        code: `// Create a new app in your Shopify Partners dashboard
// Configure webhook URLs:
// - Payment webhook: https://yoursite.com/shopify-webhook
// - Order webhook: https://yoursite.com/order-webhook

// In your Shopify admin:
// Settings > Payments > Manual payment methods > Create custom payment method`
      },
      {
        step: 2,
        title: "Add Payment Button to Product Pages",
        description: "Modify your theme to include OnionPay button",
        code: `<!-- Add to product-form.liquid -->
<div class="onionpay-container" style="margin-top: 20px;">
  <button 
    type="button" 
    id="onionpay-btn"
    class="btn onionpay-btn"
    style="background: #6A1B9A; color: white; width: 100%; padding: 15px; border: none; border-radius: 5px; font-size: 16px;"
  >
    Pay with OnionPay ₹{{ product.price | money_without_currency }}
  </button>
</div>

<script>
document.getElementById('onionpay-btn').addEventListener('click', function() {
  const productId = {{ product.id }};
  const variantId = {{ product.selected_or_first_available_variant.id }};
  const price = {{ product.price }};
  
  // Call your server to create OnionPay payment
  fetch('/apps/onionpay/create-payment', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-Shopify-Shop-Domain': Shopify.shop
    },
    body: JSON.stringify({
      productId: productId,
      variantId: variantId,
      amount: price / 100, // Convert from cents to rupees
      description: {{ product.title | json }},
      customerEmail: '{{ customer.email | default: "" }}'
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.paymentUrl) {
      window.location.href = data.paymentUrl;
    } else {
      alert('Payment initiation failed');
    }
  })
  .catch(error => {
    console.error('Payment error:', error);
    alert('Payment failed. Please try again.');
  });
});
</script>`
      }
    ]
  }
};

export default function IntegrationGuide() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <OnionLogo size={32} className="text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Website Integration Guide</h1>
          </div>
          <p className="text-lg text-gray-600 mb-6">
            Step-by-step guide to integrate OnionPay payment gateway on your website
          </p>
          
          <div className="flex justify-center space-x-4 mb-8">
            <Link href="/demo">
              <Button variant="outline" className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>View Demo</span>
              </Button>
            </Link>
            <Link href="/test-integration">
              <Button variant="outline" className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Test API</span>
              </Button>
            </Link>
            <Link href="/integration-docs">
              <Button className="flex items-center space-x-2">
                <Code className="h-4 w-4" />
                <span>Full Documentation</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Integration Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-1">Get API Key</h3>
                <p className="text-sm text-gray-600">Generate from dashboard</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-1">Add Button</h3>
                <p className="text-sm text-gray-600">Create payment button</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-1">Server Setup</h3>
                <p className="text-sm text-gray-600">Create payment endpoint</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">4</span>
                </div>
                <h3 className="font-semibold mb-1">Handle Webhooks</h3>
                <p className="text-sm text-gray-600">Receive confirmations</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">🚀 Integration Benefits:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>✅ Automatic amount detection from your website</li>
                <li>✅ Secure UPI payments with manual verification</li>
                <li>✅ Real-time webhook notifications</li>
                <li>✅ Professional payment interface</li>
                <li>✅ Works with any website or platform</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Platform-specific Integration */}
        <Card>
          <CardHeader>
            <CardTitle>Platform-Specific Integration</CardTitle>
            <p className="text-sm text-muted-foreground">
              Choose your platform for detailed implementation steps
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="html" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="html">HTML/JavaScript</TabsTrigger>
                <TabsTrigger value="wordpress">WordPress</TabsTrigger>
                <TabsTrigger value="shopify">Shopify</TabsTrigger>
              </TabsList>
              
              {Object.entries(integrationSteps).map(([key, platform]) => (
                <TabsContent key={key} value={key} className="space-y-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-2">{platform.title}</h3>
                    <p className="text-gray-600">Complete integration steps for {platform.title}</p>
                  </div>
                  
                  {platform.steps.map((step, index) => (
                    <Card key={index} className="border-l-4 border-l-purple-500">
                      <CardHeader>
                        <div className="flex items-start space-x-3">
                          <Badge variant="outline" className="bg-purple-100 text-purple-800 font-bold">
                            Step {step.step}
                          </Badge>
                          <div>
                            <h4 className="font-semibold">{step.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="relative">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Code:</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(step.code, `${platform.title} Step ${step.step}`)}
                              className="flex items-center space-x-1"
                            >
                              {copiedCode === `${platform.title} Step ${step.step}` ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                              <span>Copy</span>
                            </Button>
                          </div>
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                            <code>{step.code}</code>
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Security & Best Practices */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Security & Best Practices</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-green-600">✅ Do This:</h4>
                <ul className="text-sm space-y-2">
                  <li>• Store API keys securely on server-side</li>
                  <li>• Use HTTPS for all payment endpoints</li>
                  <li>• Verify webhook signatures</li>
                  <li>• Implement proper error handling</li>
                  <li>• Store payment records in your database</li>
                  <li>• Set up monitoring for failed payments</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 text-red-600">❌ Don't Do This:</h4>
                <ul className="text-sm space-y-2">
                  <li>• Never expose API keys in frontend code</li>
                  <li>• Don't skip webhook signature verification</li>
                  <li>• Don't rely only on frontend payment status</li>
                  <li>• Avoid hardcoding payment amounts</li>
                  <li>• Don't forget to handle payment timeouts</li>
                  <li>• Never skip error handling</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">💡 Auto Amount Detection:</h4>
              <p className="text-sm text-yellow-700">
                OnionPay automatically detects and captures the amount from your website's payment flow. 
                Simply pass the amount parameter when calling the initiate API, and it will be displayed 
                to users during payment with proper formatting and currency conversion.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}