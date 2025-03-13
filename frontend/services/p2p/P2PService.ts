import { LocalRxdbDatabase } from '@database/local-rxdb';
import { Order, PaymentVerification } from '@/types/p2p';
import { v4 as uuidv4 } from 'uuid';

export class P2PService {
  private db: LocalRxdbDatabase;

  constructor(db: LocalRxdbDatabase) {
    this.db = db;
  }

  async createOrder(order: Omit<Order, 'id' | 'status' | 'createdAt'>): Promise<Order> {
    const newOrder: Order = {
      ...order,
      id: uuidv4(),
      status: 'open',
      createdAt: new Date()
    };
    return this.db.createOrder(newOrder);
  }

  async getOrder(id: string): Promise<Order | null> {
    return this.db.getOrder(id);
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return this.db.getOrdersByUser(userId);
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order | null> {
    return this.db.updateOrder(id, { status });
  }

  async submitPaymentVerification(
    orderId: string,
    verification: Omit<PaymentVerification, 'orderId' | 'status' | 'verifiedAt' | 'verifiedBy'>
  ): Promise<PaymentVerification> {
    const newVerification: PaymentVerification = {
      ...verification,
      orderId,
      status: 'pending'
    };
    return this.db.createPaymentVerification(newVerification);
  }

  async getOrderVerifications(orderId: string): Promise<PaymentVerification[]> {
    return this.db.getPaymentVerificationsByOrder(orderId);
  }

  async verifyPayment(orderId: string): Promise<boolean> {
    const verification = await this.db.getPaymentVerification(orderId);
    if (!verification) {
      return false;
    }

    await this.db.updatePaymentVerification(orderId, { 
      status: 'verified',
      verifiedAt: new Date(),
      verifiedBy: 'system' // TODO: Replace with actual verifier
    });

    await this.db.updateOrder(orderId, { status: 'completed' });

    return true;
  }

  async disputeOrder(orderId: string): Promise<boolean> {
    const order = await this.db.getOrder(orderId);
    if (!order) {
      return false;
    }

    await this.db.updateOrder(orderId, { status: 'disputed' });
    return true;
  }
} 