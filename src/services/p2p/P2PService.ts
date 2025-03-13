import { v4 as uuidv4 } from 'uuid';
import { LocalRxdbDatabase } from '@database/local-rxdb';
import { P2PTransaction, P2PTransactionStatus, P2POffer, P2PPaymentVerification } from '@types/p2p';

export class P2PService {
  private db: LocalRxdbDatabase;

  constructor(db: LocalRxdbDatabase) {
    this.db = db;
  }

  async createOffer(offer: Omit<P2POffer, 'id' | 'status' | 'createdAt'>): Promise<P2POffer> {
    const newOffer: P2POffer = {
      ...offer,
      id: uuidv4(),
      status: 'active',
      createdAt: new Date().toISOString()
    };
    return this.db.createP2POffer(newOffer);
  }

  async getActiveOffers(): Promise<P2POffer[]> {
    return this.db.getActiveP2POffers();
  }

  async getUserOffers(userId: string): Promise<P2POffer[]> {
    return this.db.getP2POffersByUser(userId);
  }

  async createTransaction(transaction: Omit<P2PTransaction, 'id' | 'status' | 'createdAt'>): Promise<P2PTransaction> {
    const newTransaction: P2PTransaction = {
      ...transaction,
      id: uuidv4(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    return this.db.createP2PTransaction(newTransaction);
  }

  async getTransaction(id: string): Promise<P2PTransaction | null> {
    return this.db.getP2PTransaction(id);
  }

  async getUserTransactions(userId: string): Promise<P2PTransaction[]> {
    return this.db.getP2PTransactionsByUser(userId);
  }

  async updateTransactionStatus(id: string, status: P2PTransactionStatus): Promise<P2PTransaction | null> {
    return this.db.updateP2PTransaction(id, { status });
  }

  async submitPaymentVerification(
    transactionId: string,
    verification: Omit<P2PPaymentVerification, 'id' | 'createdAt'>
  ): Promise<P2PPaymentVerification> {
    const newVerification: P2PPaymentVerification = {
      ...verification,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    return this.db.createP2PPaymentVerification(newVerification);
  }

  async getTransactionVerifications(transactionId: string): Promise<P2PPaymentVerification[]> {
    return this.db.getP2PPaymentVerificationsByTransaction(transactionId);
  }

  async verifyPayment(transactionId: string, verificationId: string): Promise<boolean> {
    const verification = await this.db.getP2PPaymentVerification(verificationId);
    if (!verification || verification.transactionId !== transactionId) {
      return false;
    }

    // Update verification status
    await this.db.updateP2PPaymentVerification(verificationId, { status: 'verified' });

    // Update transaction status
    await this.db.updateP2PTransaction(transactionId, { status: 'completed' });

    return true;
  }

  async disputeTransaction(transactionId: string, reason: string): Promise<boolean> {
    const transaction = await this.db.getP2PTransaction(transactionId);
    if (!transaction) {
      return false;
    }

    await this.db.updateP2PTransaction(transactionId, {
      status: 'disputed',
      disputeReason: reason
    });

    return true;
  }
} 