// ====== OnionPay JavaScript Direct API - Copy Paste Ready ======

// OnionPay Configuration
const ONIONPAY_CONFIG = {
    apiUrl: 'https://onionpays.replit.app',
    apiKey: '$2b$12$ORcN1LA4ZbRsKYtgY5grU.Oe5D/2AFoZXWd7DekDYLBlWS.EkiCq6'
};

/**
 * Create OnionPay Payment Session
 * @param {Object} paymentData - Payment details
 * @returns {Promise} Payment session response
 */
async function createOnionPayPayment(paymentData) {
    try {
        const response = await fetch(`${ONIONPAY_CONFIG.apiUrl}/v1/checkout/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ONIONPAY_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                amount: paymentData.amount,
                description: paymentData.description,
                itemName: paymentData.itemName,
                customerEmail: paymentData.customerEmail
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success && result.paymentUrl) {
            return result;
        } else {
            throw new Error(result.message || 'Invalid API response');
        }
        
    } catch (error) {
        console.error('OnionPay Error:', error);
        throw error;
    }
}

/**
 * Check OnionPay Payment Status
 * @param {string} orderId - Order ID to check
 * @returns {Promise} Payment status
 */
async function checkOnionPayStatus(orderId) {
    try {
        const response = await fetch(`${ONIONPAY_CONFIG.apiUrl}/v1/checkout/status/${orderId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('Status Check Error:', error);
        throw error;
    }
}

// ====== USAGE EXAMPLES ======

/**
 * Example 1: Create Payment and Redirect
 */
async function payNow(amount, description, itemName, customerEmail = null) {
    try {
        // Show loading
        document.getElementById('payButton').disabled = true;
        document.getElementById('payButton').textContent = 'Creating Payment...';
        
        // Create payment session
        const session = await createOnionPayPayment({
            amount: amount,
            description: description,
            itemName: itemName,
            customerEmail: customerEmail
        });
        
        // Redirect to OnionPay
        window.location.href = session.paymentUrl;
        
    } catch (error) {
        alert('Payment Error: ' + error.message);
        
        // Reset button
        document.getElementById('payButton').disabled = false;
        document.getElementById('payButton').textContent = 'Pay Now';
    }
}

/**
 * Example 2: Create Payment in Modal (No Redirect)
 */
async function payInModal(amount, description, itemName, customerEmail = null) {
    try {
        const session = await createOnionPayPayment({
            amount: amount,
            description: description,
            itemName: itemName,
            customerEmail: customerEmail
        });
        
        // Open in popup/iframe
        const popup = window.open(session.paymentUrl, 'onionpay', 'width=600,height=700');
        
        // Poll for payment completion
        const checkPayment = setInterval(async () => {
            try {
                const status = await checkOnionPayStatus(session.orderId);
                
                if (status.status === 'approved') {
                    clearInterval(checkPayment);
                    popup.close();
                    alert('Payment Successful! Order ID: ' + status.orderId);
                    // Handle success (redirect, update UI, etc.)
                    window.location.reload();
                    
                } else if (status.status === 'failed' || status.status === 'expired') {
                    clearInterval(checkPayment);
                    popup.close();
                    alert('Payment failed or expired');
                }
            } catch (error) {
                console.error('Status check failed:', error);
            }
        }, 3000); // Check every 3 seconds
        
        // Stop checking after 10 minutes
        setTimeout(() => {
            clearInterval(checkPayment);
            popup.close();
        }, 10 * 60 * 1000);
        
    } catch (error) {
        alert('Payment Error: ' + error.message);
    }
}

/**
 * Example 3: Check Payment Status
 */
async function checkPaymentStatus(orderId) {
    try {
        const status = await checkOnionPayStatus(orderId);
        console.log('Payment Status:', status);
        return status;
        
    } catch (error) {
        console.error('Status check failed:', error);
        return null;
    }
}

// ====== HTML Integration Examples ======

/*
<!-- Example HTML Usage -->
<button id="payButton" onclick="payNow(999, 'Product Purchase', 'Premium Plan', 'customer@example.com')">
    Pay ₹999
</button>

<button onclick="payInModal(499, 'Service Purchase', 'Basic Service')">
    Pay ₹499 (Modal)
</button>

<input type="text" id="orderIdInput" placeholder="Enter Order ID">
<button onclick="checkPaymentStatus(document.getElementById('orderIdInput').value)">
    Check Status
</button>
*/

// ====== End OnionPay JavaScript Integration ======