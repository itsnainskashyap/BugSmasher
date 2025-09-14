import {
  users,
  products,
  qrCodes,
  orders,
  apiKeys,
  type User,
  type UpsertUser,
  type Product,
  type InsertProduct,
  type QrCode,
  type InsertQrCode,
  type Order,
  type InsertOrder,
  type ApiKey,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  
  // QR Code operations
  getActiveQrCode(): Promise<QrCode | undefined>;
  createQrCode(qrCode: InsertQrCode): Promise<QrCode>;
  updateQrCode(id: string, qrCode: Partial<InsertQrCode>): Promise<QrCode>;
  
  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByOrderId(orderId: string): Promise<Order | undefined>;
  updateOrder(id: string, order: Partial<Order>): Promise<Order>;
  getPendingOrders(): Promise<Order[]>;
  getRecentOrders(limit?: number): Promise<Order[]>;
  
  // API Key operations
  createApiKey(userId: string, name: string): Promise<{ key: string; apiKey: ApiKey }>;
  validateApiKey(plainTextKey: string): Promise<ApiKey | undefined>;
  getUserApiKeys(userId: string): Promise<ApiKey[]>;
  deactivateApiKey(id: string, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
  }

  // QR Code operations
  async getActiveQrCode(): Promise<QrCode | undefined> {
    const [qrCode] = await db.select().from(qrCodes).where(eq(qrCodes.isActive, true)).orderBy(desc(qrCodes.createdAt));
    return qrCode;
  }

  async createQrCode(qrCode: InsertQrCode): Promise<QrCode> {
    // Deactivate existing QR codes
    await db.update(qrCodes).set({ isActive: false });
    
    const [newQrCode] = await db.insert(qrCodes).values(qrCode).returning();
    return newQrCode;
  }

  async updateQrCode(id: string, qrCode: Partial<InsertQrCode>): Promise<QrCode> {
    const [updatedQrCode] = await db
      .update(qrCodes)
      .set({ ...qrCode, updatedAt: new Date() })
      .where(eq(qrCodes.id, id))
      .returning();
    return updatedQrCode;
  }

  // Order operations
  async createOrder(order: InsertOrder): Promise<Order> {
    const orderId = `ONP-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const [newOrder] = await db.insert(orders).values({
      ...order,
      orderId,
    }).returning();
    return newOrder;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderByOrderId(orderId: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderId, orderId));
    return order;
  }

  async updateOrder(id: string, order: Partial<Order>): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async getPendingOrders(): Promise<Order[]> {
    return await db.select().from(orders)
      .where(and(
        eq(orders.status, "pending"),
        gte(orders.expiresAt, new Date())
      ))
      .orderBy(desc(orders.createdAt));
  }

  async getRecentOrders(limit = 10): Promise<Order[]> {
    return await db.select().from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  // API Key operations
  async createApiKey(userId: string, name: string): Promise<{ key: string; apiKey: ApiKey }> {
    const key = `onp_live_${randomUUID().replace(/-/g, '')}`;
    const saltRounds = 12;
    const keyHash = await bcrypt.hash(key, saltRounds);
    
    const [apiKey] = await db.insert(apiKeys).values({
      userId,
      keyHash,
      name,
    }).returning();
    
    return { key, apiKey };
  }

  async validateApiKey(plainTextKey: string): Promise<ApiKey | undefined> {
    // Get all active API keys for comparison
    const activeApiKeys = await db.select().from(apiKeys)
      .where(eq(apiKeys.isActive, true));
    
    // Check each key using bcrypt comparison
    for (const apiKey of activeApiKeys) {
      const isValid = await bcrypt.compare(plainTextKey, apiKey.keyHash);
      if (isValid) {
        // Update last used timestamp
        await db.update(apiKeys)
          .set({ lastUsedAt: new Date() })
          .where(eq(apiKeys.id, apiKey.id));
        
        return apiKey;
      }
    }
    
    return undefined;
  }

  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    return await db.select().from(apiKeys)
      .where(and(eq(apiKeys.userId, userId), eq(apiKeys.isActive, true)))
      .orderBy(desc(apiKeys.createdAt));
  }

  async deactivateApiKey(id: string, userId: string): Promise<void> {
    await db.update(apiKeys)
      .set({ isActive: false })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
