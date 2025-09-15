import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProductSchema, insertQrCodeSchema, insertOrderSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Connected WebSocket clients
const connectedClients = new Set<any>();

function broadcastToClients(message: any) {
  connectedClients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(message));
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // API Key middleware
  const validateApiKey = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'API key required' });
    }

    const key = authHeader.substring(7);
    const apiKey = await storage.validateApiKey(key);
    
    if (!apiKey) {
      return res.status(401).json({ message: 'Invalid API key' });
    }

    req.apiKey = apiKey;
    next();
  };

  // Product routes
  app.get('/api/products', isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error: any) {
      console.error("Error creating product:", error);
      res.status(400).json({ message: error.message || "Failed to create product" });
    }
  });

  app.put('/api/products/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, productData);
      res.json(product);
    } catch (error: any) {
      console.error("Error updating product:", error);
      res.status(400).json({ message: error.message || "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // QR Code routes
  app.get('/api/qr-code', isAuthenticated, async (req, res) => {
    try {
      const qrCode = await storage.getActiveQrCode();
      res.json(qrCode);
    } catch (error) {
      console.error("Error fetching QR code:", error);
      res.status(500).json({ message: "Failed to fetch QR code" });
    }
  });

  app.post('/api/qr-code', isAuthenticated, upload.single('qrImage'), async (req, res) => {
    try {
      const { upiId } = req.body;
      if (!upiId) {
        return res.status(400).json({ message: "UPI ID is required" });
      }

      let imageUrl = null;
      if (req.file) {
        // In production, upload to cloud storage (Cloudinary, AWS S3, etc.)
        // For now, save locally
        const fileName = `qr-${Date.now()}.${req.file.originalname.split('.').pop()}`;
        const filePath = path.join('uploads', fileName);
        fs.renameSync(req.file.path, filePath);
        imageUrl = `/uploads/${fileName}`;
      }

      const qrCode = await storage.createQrCode({ upiId, imageUrl });
      res.json(qrCode);
    } catch (error: any) {
      console.error("Error creating QR code:", error);
      res.status(400).json({ message: error.message || "Failed to create QR code" });
    }
  });

  // API Key management routes (authenticated)
  app.get('/api/api-keys', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const apiKeys = await storage.getUserApiKeys(userId);
      res.json(apiKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ message: "Failed to fetch API keys" });
    }
  });

  app.post('/api/api-keys', isAuthenticated, async (req: any, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1).max(100),
      });
      
      const { name } = schema.parse(req.body);
      const userId = req.user.claims.sub;
      const result = await storage.createApiKey(userId, name);
      
      res.json(result);
    } catch (error: any) {
      console.error("Error creating API key:", error);
      res.status(400).json({ message: error.message || "Failed to create API key" });
    }
  });

  app.delete('/api/api-keys/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      await storage.deactivateApiKey(id, userId);
      res.json({ message: "API key deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating API key:", error);
      res.status(500).json({ message: "Failed to deactivate API key" });
    }
  });

  // Enhanced amount parser for auto-detection
  const parseAmount = (amountInput: any): number | null => {
    if (typeof amountInput === 'number' && amountInput > 0) {
      return Math.round(amountInput * 100); // Convert to paise
    }
    
    if (typeof amountInput === 'string') {
      // Remove currency symbols and clean the string
      const cleaned = amountInput
        .replace(/[₹$€£¥,\s]/g, '') // Remove currency symbols and commas
        .replace(/\.(\d{3,})/g, '$1') // Handle thousands separator dots
        .trim();
      
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed > 0) {
        return Math.round(parsed * 100); // Convert to paise
      }
    }
    
    return null;
  };

  // Payment API routes (public, require API key)
  app.post('/api/onionpay/initiate', validateApiKey, async (req: any, res) => {
    try {
      const schema = z.object({
        productId: z.string().optional(),
        amount: z.union([z.number(), z.string()]).optional(), // Accept both number and string
        description: z.string(),
        customerEmail: z.string().email().optional(),
        callbackUrl: z.string().url().optional(),
        // Enhanced fields for better integration
        currency: z.string().optional(), // Support for currency detection
        priceText: z.string().optional(), // Support for price text parsing
        itemName: z.string().optional(), // Item name for better description
      });

      const data = schema.parse(req.body);
      
      let amount: number | null = null;
      let productId = data.productId;
      let finalDescription = data.description;

      // Auto-detect amount from multiple sources
      if (data.amount) {
        amount = parseAmount(data.amount);
      } else if (data.priceText) {
        amount = parseAmount(data.priceText);
      }

      // If productId provided, fetch amount from product
      if (productId && !amount) {
        const product = await storage.getProduct(productId);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }
        amount = product.price;
        // Enhance description with product info
        if (data.itemName) {
          finalDescription = `${data.itemName} - ${data.description}`;
        }
      }

      // Enhanced description with item name
      if (data.itemName && !productId) {
        finalDescription = `${data.itemName} - ${data.description}`;
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({ 
          message: "Valid amount is required. Provide amount as number (in rupees) or string with currency symbol (₹100, 100.50, etc.)" 
        });
      }

      // Validate amount range (minimum ₹1, maximum ₹1,00,000)
      if (amount < 100 || amount > 10000000) {
        return res.status(400).json({ 
          message: "Amount must be between ₹1 and ₹1,00,000" 
        });
      }

      // Get active QR code
      const qrCode = await storage.getActiveQrCode();
      if (!qrCode) {
        return res.status(503).json({ message: "Payment gateway not configured" });
      }

      // Create order
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      const order = await storage.createOrder({
        productId,
        amount,
        customerEmail: data.customerEmail,
        description: finalDescription,
        qrCodeId: qrCode.id,
        callbackUrl: data.callbackUrl,
        expiresAt,
      });

      // Generate payment page data with enhanced information
      const paymentData = {
        orderId: order.orderId,
        amount: amount / 100, // Convert paise to rupees for display
        amountInPaise: amount, // Original amount in paise
        description: finalDescription,
        qrCodeUrl: qrCode.imageUrl,
        upiId: qrCode.upiId,
        expiresAt: expiresAt.toISOString(),
        paymentUrl: `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/payment/${order.orderId}`,
        // Additional metadata for 3rd party integrations
        currency: data.currency || 'INR',
        itemName: data.itemName,
        integrationInfo: {
          autoDetected: !!data.priceText || (typeof data.amount === 'string'),
          originalAmount: data.amount || data.priceText,
          parsedAmount: amount / 100,
        }
      };

      res.json(paymentData);
    } catch (error: any) {
      console.error("Error initiating payment:", error);
      res.status(400).json({ message: error.message || "Failed to initiate payment" });
    }
  });

  app.post('/api/onionpay/submit', async (req, res) => {
    try {
      const schema = z.object({
        orderId: z.string(),
        utr: z.string().min(8).max(20),
      });

      const { orderId, utr } = schema.parse(req.body);
      
      const order = await storage.getOrderByOrderId(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.status !== 'pending') {
        return res.status(400).json({ message: "Order is not pending" });
      }

      if (new Date() > order.expiresAt) {
        await storage.updateOrder(order.id, { status: 'expired' });
        return res.status(400).json({ message: "Order has expired" });
      }

      // Update order with UTR
      const updatedOrder = await storage.updateOrder(order.id, { utr });

      // Broadcast to admin dashboard
      broadcastToClients({
        type: 'PAYMENT_SUBMITTED',
        data: updatedOrder,
      });

      res.json({ message: "Payment proof submitted successfully", orderId: order.orderId });
    } catch (error: any) {
      console.error("Error submitting payment:", error);
      res.status(400).json({ message: error.message || "Failed to submit payment" });
    }
  });

  app.get('/api/onionpay/status/:orderId', async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await storage.getOrderByOrderId(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if order has expired
      if (order.status === 'pending' && new Date() > order.expiresAt) {
        await storage.updateOrder(order.id, { status: 'expired' });
        return res.json({ status: 'expired' });
      }

      res.json({ 
        status: order.status,
        orderId: order.orderId,
        amount: order.amount,
        updatedAt: order.updatedAt,
      });
    } catch (error) {
      console.error("Error checking payment status:", error);
      res.status(500).json({ message: "Failed to check payment status" });
    }
  });

  // Admin dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getRecentOrders(100);
      const pendingOrders = await storage.getPendingOrders();
      
      const totalRevenue = orders
        .filter(o => o.status === 'approved')
        .reduce((sum, o) => sum + o.amount, 0);
      
      const successfulPayments = orders.filter(o => o.status === 'approved').length;
      const totalPayments = orders.length;
      const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;
      
      const products = await storage.getProducts();

      res.json({
        totalRevenue: Math.round(totalRevenue / 100), // Convert to rupees
        pendingPayments: pendingOrders.length,
        successfulPayments,
        successRate: Math.round(successRate * 10) / 10,
        activeProducts: products.length,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/pending-orders', isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getPendingOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching pending orders:", error);
      res.status(500).json({ message: "Failed to fetch pending orders" });
    }
  });

  app.post('/api/dashboard/approve-payment/:orderId', isAuthenticated, async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await storage.getOrderByOrderId(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const updatedOrder = await storage.updateOrder(order.id, { 
        status: 'approved',
        approvedAt: new Date(),
      });

      // Broadcast to all clients
      broadcastToClients({
        type: 'PAYMENT_APPROVED',
        data: updatedOrder,
      });

      // Call webhook if provided
      if (order.callbackUrl) {
        try {
          await fetch(order.callbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.orderId,
              status: 'approved',
              amount: order.amount,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (webhookError) {
          console.error("Webhook error:", webhookError);
        }
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error("Error approving payment:", error);
      res.status(500).json({ message: "Failed to approve payment" });
    }
  });

  app.post('/api/dashboard/reject-payment/:orderId', isAuthenticated, async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await storage.getOrderByOrderId(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const updatedOrder = await storage.updateOrder(order.id, { status: 'failed' });

      // Broadcast to all clients
      broadcastToClients({
        type: 'PAYMENT_REJECTED',
        data: updatedOrder,
      });

      res.json(updatedOrder);
    } catch (error) {
      console.error("Error rejecting payment:", error);
      res.status(500).json({ message: "Failed to reject payment" });
    }
  });

  // API key management
  app.get('/api/api-keys', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const apiKeys = await storage.getUserApiKeys(userId);
      res.json(apiKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ message: "Failed to fetch API keys" });
    }
  });

  app.post('/api/api-keys', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name } = req.body;
      const { key, apiKey } = await storage.createApiKey(userId, name || 'Default Key');
      res.json({ key, apiKey });
    } catch (error) {
      console.error("Error creating API key:", error);
      res.status(500).json({ message: "Failed to create API key" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    next();
  });

  const httpServer = createServer(app);

  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    connectedClients.add(ws);
    console.log('Client connected to WebSocket');

    ws.on('close', () => {
      connectedClients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      connectedClients.delete(ws);
    });
  });

  return httpServer;
}
