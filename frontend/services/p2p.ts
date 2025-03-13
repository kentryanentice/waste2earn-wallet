import { Order, PaymentMethod, Escrow, PaymentVerification } from "@/types/p2p";
import { db } from "@/database/db";

class P2PService {
  private static instance: P2PService;
  private readonly ESCROW_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {}

  static getInstance(): P2PService {
    if (!P2PService.instance) {
      P2PService.instance = new P2PService();
    }
    return P2PService.instance;
  }

  async createOrder(order: Omit<Order, "id" | "createdAt" | "status" | "expiresAt">): Promise<Order> {
    const newOrder: Order = {
      ...order,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      status: "open",
      expiresAt: new Date(Date.now() + this.ESCROW_TIMEOUT),
    };

    // Store order in local database
    await db().contacts.addOrder(newOrder);
    return newOrder;
  }

  async lockTokensInEscrow(order: Order): Promise<Escrow> {
    const escrow: Escrow = {
      id: Math.random().toString(36).substr(2, 9),
      orderId: order.id,
      amount: order.amount,
      status: "locked",
      lockedAt: new Date(),
      expiresAt: new Date(Date.now() + this.ESCROW_TIMEOUT),
    };

    // Store escrow in local database
    await db().contacts.addEscrow(escrow);
    return escrow;
  }

  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
    await db().contacts.updateOrderStatus(orderId, status);
  }

  async getAvailableOrders(): Promise<Order[]> {
    return db().contacts.getOpenOrders();
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    return db().contacts.getOrderById(orderId);
  }

  async getEscrowByOrderId(orderId: string): Promise<Escrow | null> {
    return db().contacts.getEscrowByOrderId(orderId);
  }

  async createPaymentVerification(verification: Omit<PaymentVerification, "status">): Promise<PaymentVerification> {
    const newVerification: PaymentVerification = {
      ...verification,
      status: "pending",
    };

    await db().contacts.addPaymentVerification(newVerification);
    return newVerification;
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    // This would typically come from a backend service
    return [
      {
        id: "gcash",
        name: "GCash",
        type: "gcash",
        details: {
          walletAddress: "09123456789",
        },
      },
      {
        id: "maya",
        name: "Maya",
        type: "maya",
        details: {
          walletAddress: "09123456789",
        },
      },
      {
        id: "bpi",
        name: "BPI",
        type: "bank",
        details: {
          accountNumber: "1234567890",
          accountName: "Waste2Earn",
          bankName: "Bank of the Philippine Islands",
        },
      },
    ];
  }
}

export const p2pService = P2PService.getInstance(); 