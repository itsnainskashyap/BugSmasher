# OnionPay 3rd Party Integration Guide

## Quick Start - JavaScript Widget Integration

### Simple HTML Integration
```html
<!DOCTYPE html>
<html>
<head>
    <title>My E-commerce Store</title>
</head>
<body>
    <div class="product">
        <h3>Premium Product</h3>
        <div id="product-price">₹2999</div>
        
        <!-- OnionPay Button with Auto Price Detection -->
        <button 
            data-onionpay="pay"
            data-amount-selector="#product-price"
            data-desc="Premium Product Purchase"
            data-item="Premium Product"
            data-key="pk_YOUR_PUBLISHABLE_KEY_HERE"
            data-callback-url="https://yoursite.com/webhook/payment-success"
            data-redirect="false"
            class="pay-button">
            Buy Now - Auto Price ₹2999
        </button>
    </div>
    
    <!-- Load OnionPay Widget -->
    <script src="YOUR_ONIONPAY_DOMAIN/widget/onionpay.js"></script>
    
    <script>
        // Handle payment success with auto-redirect
        window.addEventListener('onionpay:success', function(event) {
            console.log('Payment Success:', event.detail);
            alert('Payment successful! Redirecting...');
            setTimeout(() => {
                window.location.href = '/success?order=' + event.detail.orderId;
            }, 2000);
        });
        
        // Handle payment failure
        window.addEventListener('onionpay:failed', function(event) {
            console.log('Payment Failed:', event.detail);
            alert('Payment failed. Please try again.');
        });
        
        // Handle payment expiry
        window.addEventListener('onionpay:expired', function(event) {
            console.log('Payment Expired:', event.detail);
            alert('Payment session expired. Please try again.');
        });
    </script>
</body>
</html>
```

## Advanced Widget Configuration

### All Available Attributes
```html
<button 
    data-onionpay="pay"
    data-amount="2999"                      <!-- Fixed amount in rupees -->
    data-amount-selector=".price-display"   <!-- OR auto-fetch from element -->
    data-desc="Product Purchase Description" <!-- Required: Payment description -->
    data-item="Product Name"                <!-- Item/product name -->
    data-email="customer@example.com"       <!-- Customer email (optional) -->
    data-key="pk_your_publishable_key"     <!-- Required: Publishable API key -->
    data-callback-url="https://site.com/webhook" <!-- Webhook URL for server notifications -->
    data-redirect="true"                    <!-- true = redirect, false = modal -->
    data-api-base="https://custom-domain.com" <!-- Custom OnionPay domain -->
    class="payment-button">
    Pay Now
</button>
```

**Important Notes:**
- Use **publishable keys** (`pk_...`) in frontend HTML/JavaScript
- Use **secret keys** (`sk_...`) only in server-side code
- Auto price fetch automatically parses currency symbols (₹2999, $29.99, etc.)
- Widget handles number conversion from text elements

## Server-Side Integration Examples

### PHP Integration with Auto Price Fetch
```php
<?php
// payment-handler.php

function initiateOnionPayPayment($productId, $customerEmail = null) {
    $apiKey = "YOUR_API_KEY";
    $apiBase = "YOUR_ONIONPAY_DOMAIN";
    
    // Auto-fetch product details from your database
    $product = getProductDetails($productId); // Your function
    
    $paymentData = [
        'amount' => $product['price'], // Auto-detected price
        'description' => 'Purchase of ' . $product['name'],
        'itemName' => $product['name'],
        'customerEmail' => $customerEmail,
        'callbackUrl' => 'https://yoursite.com/payment-webhook.php'
    ];
    
    // Create checkout session
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiBase . '/v1/checkout/sessions');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($paymentData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $result = json_decode($response, true);
    
    if ($result && isset($result['paymentUrl'])) {
        // Auto redirect to payment page
        header('Location: ' . $result['paymentUrl']);
        exit;
    } else {
        throw new Exception('Payment initiation failed');
    }
}

// Usage
if ($_POST['product_id']) {
    initiateOnionPayPayment($_POST['product_id'], $_POST['email']);
}
?>
```

### Node.js/Express Integration
```javascript
const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());

// Auto price fetch and payment initiation
app.post('/create-payment', async (req, res) => {
    const { productId, customerEmail, redirectUrl } = req.body;
    
    try {
        // Auto-fetch product details
        const product = await getProductFromDatabase(productId);
        
        // Create OnionPay session
        const response = await fetch(`${process.env.ONIONPAY_DOMAIN}/v1/checkout/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.ONIONPAY_API_KEY}`
            },
            body: JSON.stringify({
                amount: product.price,
                description: `Purchase of ${product.name}`,
                itemName: product.name,
                customerEmail: customerEmail,
                callbackUrl: `${process.env.BASE_URL}/webhook/payment-success`
            })
        });
        
        const session = await response.json();
        
        if (session.success && session.paymentUrl) {
            // Return payment URL for auto-redirect
            res.json({ 
                success: true, 
                paymentUrl: session.paymentUrl,
                orderId: session.orderId
            });
        } else {
            res.status(400).json({ success: false, error: session.message || 'Invalid response' });
        }
        
    } catch (error) {
        console.error('Payment creation error:', error);
        res.status(500).json({ success: false, error: 'Payment initiation failed' });
    }
});

// Webhook handler for auto-processing
app.post('/webhook/payment-success', async (req, res) => {
    const { orderId, status, amount } = req.body;
    
    if (status === 'approved') {
        // Auto-process order completion
        await markOrderAsCompleted(orderId);
        await sendConfirmationEmail(orderId);
        
        console.log(`Payment approved for order ${orderId}: ₹${amount}`);
    }
    
    res.json({ received: true });
});
```

## React Component Integration

### OnionPay React Hook
```jsx
import React, { useState, useEffect } from 'react';

const useOnionPay = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        // Load OnionPay widget
        const script = document.createElement('script');
        script.src = `${process.env.REACT_APP_ONIONPAY_DOMAIN}/widget/onionpay.js`;
        script.async = true;
        document.head.appendChild(script);
        
        // Event listeners
        const handleSuccess = (event) => {
            setLoading(false);
            console.log('Payment successful:', event.detail);
            // Auto redirect after success
            setTimeout(() => {
                window.location.href = `/success?order=${event.detail.orderId}`;
            }, 1500);
        };
        
        const handleError = (event) => {
            setLoading(false);
            setError(event.detail.message);
        };
        
        window.addEventListener('onionpay:success', handleSuccess);
        window.addEventListener('onionpay:failed', handleError);
        window.addEventListener('onionpay:error', handleError);
        
        return () => {
            window.removeEventListener('onionpay:success', handleSuccess);
            window.removeEventListener('onionpay:failed', handleError);
            window.removeEventListener('onionpay:error', handleError);
        };
    }, []);
    
    const initiatePayment = (element) => {
        setLoading(true);
        setError(null);
        // OnionPay widget will handle the rest
    };
    
    return { loading, error, initiatePayment };
};

// OnionPay Button Component
const OnionPayButton = ({ amount, description, itemName, className, children }) => {
    const { loading, error } = useOnionPay();
    
    return (
        <div>
            <button
                data-onionpay="pay"
                data-amount={amount}
                data-desc={description}
                data-item={itemName}
                data-key={process.env.REACT_APP_ONIONPAY_API_KEY}
                data-redirect="false"
                className={`${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading}
            >
                {loading ? 'Processing...' : children}
            </button>
            {error && (
                <div className="text-red-500 text-sm mt-2">
                    Error: {error}
                </div>
            )}
        </div>
    );
};

// Usage Example
function ProductPage() {
    return (
        <div className="product-card">
            <h2>Premium Course</h2>
            <p className="price">₹2999</p>
            
            <OnionPayButton
                amount="2999"
                description="Premium Web Development Course"
                itemName="Web Dev Course"
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
            >
                Enroll Now - ₹2999
            </OnionPayButton>
        </div>
    );
}
```

## Auto Redirection Patterns

### Pattern 1: Immediate Redirect
```html
<button 
    data-onionpay="pay"
    data-amount="1999"
    data-desc="Product Purchase"
    data-key="your_api_key"
    data-redirect="true">  <!-- Immediate redirect to payment page -->
    Pay ₹1999
</button>
```

### Pattern 2: Modal with Success Redirect
```javascript
window.addEventListener('onionpay:success', function(event) {
    // Show success message first
    showSuccessToast('Payment successful!');
    
    // Auto redirect after 2 seconds
    setTimeout(() => {
        window.location.href = '/success?order=' + event.detail.orderId;
    }, 2000);
});
```

### Pattern 3: AJAX with Custom Redirect Logic
```javascript
async function handleCustomPayment(productId) {
    try {
        // Auto-fetch product and create payment
        const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Auto redirect to OnionPay
            window.location.href = result.paymentUrl;
        } else {
            alert('Payment creation failed: ' + result.error);
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('Payment initialization failed');
    }
}
```

## Webhook Integration for Auto-Processing

### PHP Webhook Handler
```php
<?php
// webhook.php

// Verify webhook authenticity (required for security)
function verifyWebhookSignature($payload, $signature) {
    $webhookSecret = $_ENV['WEBHOOK_SECRET'] ?? 'your-webhook-secret';
    $expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $webhookSecret);
    return hash_equals($signature, $expectedSignature);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = file_get_contents('php://input');
    $signature = $_SERVER['HTTP_X_ONIONPAY_SIGNATURE'] ?? '';
    
    if (!verifyWebhookSignature($payload, $signature)) {
        http_response_code(401);
        exit('Unauthorized');
    }
    
    $data = json_decode($payload, true);
    
    switch ($data['status']) {
        case 'approved':
            // Auto-process successful payment
            markOrderCompleted($data['orderId']);
            sendConfirmationEmail($data['orderId']);
            updateInventory($data['orderId']);
            break;
            
        case 'failed':
            // Handle failed payment
            markOrderFailed($data['orderId']);
            break;
            
        case 'expired':
            // Handle expired payment
            markOrderExpired($data['orderId']);
            break;
    }
    
    // Acknowledge receipt
    http_response_code(200);
    echo json_encode(['status' => 'received']);
}
?>
```

## API Reference

### Create Checkout Session
```
POST /v1/checkout/sessions
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "amount": 2999,
  "description": "Product Purchase",
  "itemName": "Product Name",
  "customerEmail": "customer@example.com",
  "callbackUrl": "https://yoursite.com/webhook"
}
```

### Check Payment Status
```
GET /v1/checkout/status/{orderId}

Response:
{
  "status": "approved|pending|failed|expired",
  "orderId": "string",
  "amount": number,
  "updatedAt": "ISO date"
}
```

## Security Best Practices

1. **API Key Security**: Store API keys in environment variables
2. **Webhook Verification**: Always verify webhook signatures
3. **HTTPS Only**: Use HTTPS for all payment communications
4. **Input Validation**: Validate all payment amounts and data
5. **Error Handling**: Implement proper error handling for failed payments

## Testing Integration

1. Create test API keys in OnionPay dashboard
2. Use small amounts (₹1-10) for testing
3. Test all payment flows (success, failure, expiry)
4. Verify webhook deliveries
5. Test auto-redirect functionality

## Support

For integration support:
- Check OnionPay dashboard for API keys
- Test webhooks using provided test endpoints
- Monitor payment status in real-time
- Contact support for advanced integration needs