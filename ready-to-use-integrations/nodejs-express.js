// ====== OnionPay Node.js Express Integration - Copy Paste Ready ======

const express = require('express');
const fetch = require('node-fetch'); // npm install node-fetch
const app = express();

// OnionPay Configuration
const ONIONPAY_CONFIG = {
    apiUrl: 'https://onionpays.replit.app',
    apiKey: '$2b$12$ORcN1LA4ZbRsKYtgY5grU.Oe5D/2AFoZXWd7DekDYLBlWS.EkiCq6'
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Create OnionPay Payment Session
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

        const result = await response.json();
        
        if (response.ok && result.success) {
            return result;
        } else {
            throw new Error(result.message || 'Payment creation failed');
        }
        
    } catch (error) {
        console.error('OnionPay Error:', error);
        throw error;
    }
}

/**
 * Check OnionPay Payment Status
 */
async function checkOnionPayStatus(orderId) {
    try {
        const response = await fetch(`${ONIONPAY_CONFIG.apiUrl}/v1/checkout/status/${orderId}`);
        
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Status check failed');
        }
        
    } catch (error) {
        console.error('Status Check Error:', error);
        throw error;
    }
}

// ====== API ROUTES ======

/**
 * Route 1: Create Payment Session
 * POST /create-payment
 */
app.post('/create-payment', async (req, res) => {
    try {
        const { amount, description, itemName, customerEmail } = req.body;
        
        // Validate required fields
        if (!amount || !description) {
            return res.status(400).json({ 
                error: 'Amount and description are required' 
            });
        }
        
        // Create payment session
        const session = await createOnionPayPayment({
            amount: parseFloat(amount),
            description: description,
            itemName: itemName || null,
            customerEmail: customerEmail || null
        });
        
        res.json({
            success: true,
            orderId: session.orderId,
            paymentUrl: session.paymentUrl,
            amount: session.amount,
            expiresAt: session.expiresAt
        });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * Route 2: Check Payment Status
 * GET /payment-status/:orderId
 */
app.get('/payment-status/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const status = await checkOnionPayStatus(orderId);
        
        res.json(status);
        
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
});

/**
 * Route 3: Create Payment and Redirect
 * POST /pay-now
 */
app.post('/pay-now', async (req, res) => {
    try {
        const { amount, description, itemName, customerEmail } = req.body;
        
        // Create payment session
        const session = await createOnionPayPayment({
            amount: parseFloat(amount),
            description: description,
            itemName: itemName,
            customerEmail: customerEmail
        });
        
        // Redirect to OnionPay
        res.redirect(session.paymentUrl);
        
    } catch (error) {
        res.status(500).send('Payment Error: ' + error.message);
    }
});

/**
 * Route 4: Payment Success/Failure Handler
 * GET /payment-callback
 */
app.get('/payment-callback', async (req, res) => {
    try {
        const { order_id, status } = req.query;
        
        if (order_id) {
            const paymentStatus = await checkOnionPayStatus(order_id);
            
            if (paymentStatus.status === 'approved') {
                // Handle successful payment
                res.send(`
                    <h1>✅ Payment Successful!</h1>
                    <p>Order ID: ${paymentStatus.orderId}</p>
                    <p>Amount: ₹${paymentStatus.amount}</p>
                    <a href="/">Continue Shopping</a>
                `);
            } else {
                // Handle failed payment
                res.send(`
                    <h1>❌ Payment Failed</h1>
                    <p>Status: ${paymentStatus.status}</p>
                    <a href="/">Try Again</a>
                `);
            }
        } else {
            res.status(400).send('Order ID required');
        }
        
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
});

// ====== FRONTEND HTML EXAMPLE ======
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>OnionPay Integration Test</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .form-group { margin: 15px 0; }
            input, button { width: 100%; padding: 12px; margin: 5px 0; border: 1px solid #ddd; border-radius: 5px; }
            button { background: #6A1B9A; color: white; border: none; cursor: pointer; font-size: 16px; }
            button:hover { background: #8E24AA; }
        </style>
    </head>
    <body>
        <h1>🧅 OnionPay Integration Test</h1>
        
        <!-- Method 1: Create and Redirect -->
        <form action="/pay-now" method="POST">
            <div class="form-group">
                <input type="text" name="itemName" placeholder="Product Name" value="Test Product" required>
                <input type="number" name="amount" placeholder="Amount (₹)" value="999" required>
                <input type="text" name="description" placeholder="Description" value="Test Payment" required>
                <input type="email" name="customerEmail" placeholder="Customer Email">
                <button type="submit">Pay Now (Redirect)</button>
            </div>
        </form>
        
        <hr>
        
        <!-- Method 2: AJAX Call -->
        <div class="form-group">
            <input type="text" id="itemName2" placeholder="Product Name" value="AJAX Product">
            <input type="number" id="amount2" placeholder="Amount (₹)" value="499">
            <input type="text" id="description2" placeholder="Description" value="AJAX Payment">
            <input type="email" id="customerEmail2" placeholder="Customer Email">
            <button onclick="createPaymentAjax()">Create Payment (AJAX)</button>
        </div>
        
        <hr>
        
        <!-- Method 3: Status Check -->
        <div class="form-group">
            <input type="text" id="orderId" placeholder="Enter Order ID">
            <button onclick="checkStatus()">Check Payment Status</button>
            <div id="statusResult"></div>
        </div>
        
        <script>
            async function createPaymentAjax() {
                const data = {
                    itemName: document.getElementById('itemName2').value,
                    amount: document.getElementById('amount2').value,
                    description: document.getElementById('description2').value,
                    customerEmail: document.getElementById('customerEmail2').value
                };
                
                try {
                    const response = await fetch('/create-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        // Open payment in new tab
                        window.open(result.paymentUrl, '_blank');
                        alert('Payment created! Order ID: ' + result.orderId);
                    } else {
                        alert('Error: ' + result.error);
                    }
                    
                } catch (error) {
                    alert('Request failed: ' + error.message);
                }
            }
            
            async function checkStatus() {
                const orderId = document.getElementById('orderId').value;
                if (!orderId) return alert('Enter Order ID');
                
                try {
                    const response = await fetch('/payment-status/' + orderId);
                    const status = await response.json();
                    
                    document.getElementById('statusResult').innerHTML = 
                        '<h3>Payment Status</h3>' +
                        '<p><strong>Status:</strong> ' + status.status + '</p>' +
                        '<p><strong>Order ID:</strong> ' + status.orderId + '</p>' +
                        '<p><strong>Amount:</strong> ₹' + status.amount + '</p>';
                        
                } catch (error) {
                    document.getElementById('statusResult').innerHTML = 
                        '<p style="color: red;">Error: ' + error.message + '</p>';
                }
            }
        </script>
    </body>
    </html>
    `);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🧅 OnionPay Server running on port ${PORT}`);
    console.log(`Test URL: http://localhost:${PORT}`);
});

// ====== End OnionPay Node.js Integration ======