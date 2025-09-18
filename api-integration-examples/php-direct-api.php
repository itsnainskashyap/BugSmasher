<?php
/**
 * OnionPay Direct API Integration - PHP Example
 * URL: https://onionpays.replit.app
 * API Key: $2b$12$ORcN1LA4ZbRsKYtgY5grU.Oe5D/2AFoZXWd7DekDYLBlWS.EkiCq6
 */

// Configuration
$onionpay_api_url = 'https://onionpays.replit.app';
$onionpay_api_key = '$2b$12$ORcN1LA4ZbRsKYtgY5grU.Oe5D/2AFoZXWd7DekDYLBlWS.EkiCq6';

/**
 * Create Payment Session using OnionPay V1 API
 */
function createOnionPayPayment($amount, $description, $itemName = null, $customerEmail = null) {
    global $onionpay_api_url, $onionpay_api_key;
    
    $payment_data = [
        'amount' => $amount,  // Amount in rupees
        'description' => $description,
        'itemName' => $itemName,
        'customerEmail' => $customerEmail,
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $onionpay_api_url . '/v1/checkout/sessions');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payment_data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $onionpay_api_key
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_error($ch)) {
        throw new Exception('cURL Error: ' . curl_error($ch));
    }
    
    curl_close($ch);
    
    $result = json_decode($response, true);
    
    if ($http_code === 200 && $result && isset($result['success']) && $result['success']) {
        return $result;
    } else {
        throw new Exception('API Error: ' . ($result['message'] ?? 'Unknown error'));
    }
}

/**
 * Check Payment Status
 */
function checkPaymentStatus($orderId) {
    global $onionpay_api_url;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $onionpay_api_url . '/v1/checkout/status/' . $orderId);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code === 200) {
        return json_decode($response, true);
    }
    
    return false;
}

// Example usage
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get product details from POST data
        $amount = $_POST['amount'] ?? 999;  // Default ₹999
        $product_name = $_POST['product_name'] ?? 'Test Product';
        $customer_email = $_POST['customer_email'] ?? null;
        
        // Create payment session
        $payment_session = createOnionPayPayment(
            $amount,
            "Purchase of {$product_name}",
            $product_name,
            $customer_email
        );
        
        // Redirect to payment page
        if ($payment_session['paymentUrl']) {
            header('Location: ' . $payment_session['paymentUrl']);
            exit;
        } else {
            throw new Exception('Payment URL not received');
        }
        
    } catch (Exception $e) {
        $error = 'Payment Error: ' . $e->getMessage();
    }
}

// Check payment status if order ID provided
if (isset($_GET['check_status']) && isset($_GET['order_id'])) {
    $status = checkPaymentStatus($_GET['order_id']);
    header('Content-Type: application/json');
    echo json_encode($status);
    exit;
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>OnionPay Direct API Integration - PHP</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .form-group { margin: 15px 0; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .pay-btn { background: #6A1B9A; color: white; border: none; padding: 15px 30px; border-radius: 5px; cursor: pointer; font-size: 16px; }
        .pay-btn:hover { background: #8E24AA; }
        .error { color: red; background: #ffe6e6; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .info { background: #e6f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>🧅 OnionPay PHP Integration</h1>
    <p><strong>API URL:</strong> https://onionpays.replit.app</p>
    <p><strong>Status:</strong> ✅ Live & Ready</p>
    
    <?php if (isset($error)): ?>
        <div class="error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>
    
    <form method="POST">
        <div class="form-group">
            <label>Product Name:</label>
            <input type="text" name="product_name" value="Premium Course" required>
        </div>
        
        <div class="form-group">
            <label>Amount (₹):</label>
            <select name="amount">
                <option value="99">₹99 - Basic Plan</option>
                <option value="499">₹499 - Standard Plan</option>
                <option value="999" selected>₹999 - Premium Plan</option>
                <option value="2999">₹2999 - Professional Plan</option>
            </select>
        </div>
        
        <div class="form-group">
            <label>Customer Email (Optional):</label>
            <input type="email" name="customer_email" placeholder="customer@example.com">
        </div>
        
        <button type="submit" class="pay-btn">🚀 Create Payment & Redirect</button>
    </form>
    
    <div class="info">
        <h3>🔧 How it works:</h3>
        <ol>
            <li>Form submits to PHP backend</li>
            <li>PHP calls <code>/v1/checkout/sessions</code> API</li>
            <li>Gets payment URL in response</li>
            <li>Automatically redirects to OnionPay payment page</li>
            <li>User completes UPI payment</li>
            <li>Gets redirected back with success/failure</li>
        </ol>
    </div>
    
    <div class="info">
        <h3>📱 Test Payment Status API:</h3>
        <input type="text" id="orderId" placeholder="Enter Order ID" style="margin-right: 10px;">
        <button onclick="checkStatus()" class="pay-btn">Check Status</button>
        <div id="statusResult" style="margin-top: 10px;"></div>
    </div>
    
    <script>
        async function checkStatus() {
            const orderId = document.getElementById('orderId').value;
            if (!orderId) {
                alert('Please enter Order ID');
                return;
            }
            
            try {
                const response = await fetch(`?check_status=1&order_id=${orderId}`);
                const status = await response.json();
                document.getElementById('statusResult').innerHTML = 
                    `<strong>Status:</strong> ${status.status}<br>
                     <strong>Order ID:</strong> ${status.orderId}<br>
                     <strong>Amount:</strong> ₹${status.amount}<br>
                     <strong>Updated:</strong> ${status.updatedAt}`;
            } catch (error) {
                document.getElementById('statusResult').innerHTML = 
                    `<span style="color: red;">Error: ${error.message}</span>`;
            }
        }
    </script>
</body>
</html>