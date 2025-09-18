<?php
// ====== OnionPay PHP Integration - Copy Paste Ready ======

// OnionPay Configuration
$ONIONPAY_API_URL = 'https://onionpays.replit.app';
$ONIONPAY_API_KEY = '$2b$12$ORcN1LA4ZbRsKYtgY5grU.Oe5D/2AFoZXWd7DekDYLBlWS.EkiCq6';

/**
 * Create OnionPay Payment Session
 * @param float $amount Amount in rupees
 * @param string $description Payment description
 * @param string $itemName Item name (optional)
 * @param string $customerEmail Customer email (optional)
 * @return array Payment session data
 */
function createOnionPayPayment($amount, $description, $itemName = null, $customerEmail = null) {
    global $ONIONPAY_API_URL, $ONIONPAY_API_KEY;
    
    $paymentData = [
        'amount' => $amount,
        'description' => $description,
        'itemName' => $itemName,
        'customerEmail' => $customerEmail,
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $ONIONPAY_API_URL . '/v1/checkout/sessions');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($paymentData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $ONIONPAY_API_KEY
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $result = json_decode($response, true);
        if ($result && isset($result['success']) && $result['success']) {
            return $result;
        }
    }
    
    throw new Exception('Payment creation failed: ' . $response);
}

/**
 * Check OnionPay Payment Status
 * @param string $orderId Order ID
 * @return array Payment status
 */
function checkOnionPayStatus($orderId) {
    global $ONIONPAY_API_URL;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $ONIONPAY_API_URL . '/v1/checkout/status/' . $orderId);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        return json_decode($response, true);
    }
    
    throw new Exception('Status check failed');
}

// ====== USAGE EXAMPLES ======

// Example 1: Create Payment and Redirect
if ($_POST['create_payment']) {
    try {
        $session = createOnionPayPayment(
            $_POST['amount'],
            $_POST['description'],
            $_POST['item_name'],
            $_POST['customer_email']
        );
        
        // Redirect to OnionPay
        header('Location: ' . $session['paymentUrl']);
        exit;
        
    } catch (Exception $e) {
        echo 'Error: ' . $e->getMessage();
    }
}

// Example 2: Check Payment Status
if ($_GET['check_status'] && $_GET['order_id']) {
    try {
        $status = checkOnionPayStatus($_GET['order_id']);
        echo json_encode($status);
        exit;
        
    } catch (Exception $e) {
        echo json_encode(['error' => $e->getMessage()]);
        exit;
    }
}

// ====== HTML FORM EXAMPLE ======
?>
<form method="POST">
    <input type="hidden" name="create_payment" value="1">
    <input type="text" name="item_name" placeholder="Product Name" required>
    <input type="number" name="amount" placeholder="Amount (₹)" required>
    <input type="text" name="description" placeholder="Description" required>
    <input type="email" name="customer_email" placeholder="Customer Email">
    <button type="submit">Pay with OnionPay</button>
</form>

<?php
// ====== End OnionPay PHP Integration ======
?>