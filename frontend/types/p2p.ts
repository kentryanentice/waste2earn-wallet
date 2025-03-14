export interface Order {
  id: string;
  sellerId: string;
  amount: number;
  price: number;
  status: OrderStatus;
  createdAt: Date;
  expiresAt: Date;
  paymentMethod: PaymentMethod;
  escrowId?: string;
}

export type OrderStatus = 
  | "open"
  | "escrow_pending"
  | "escrow_locked"
  | "payment_pending"
  | "payment_submitted"
  | "payment_verified"
  | "completed"
  | "cancelled"
  | "disputed"
  | "refunded"
  | "expired";

export interface PaymentMethod {
  id: string;
  name: string;
  type: "bank" | "gcash" | "maya" | "coins.ph";
  details: {
    accountNumber?: string;
    accountName?: string;
    bankName?: string;
    walletAddress?: string;
  };
}

export interface Escrow {
  id: string;
  orderId: string;
  amount: number;
  status: "locked" | "released" | "refunded";
  lockedAt: Date;
  expiresAt: Date;
}

export interface PaymentVerification {
  orderId: string;
  status: "pending" | "verified" | "rejected";
  proof?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
} 

export type P2PTransactionStatus = 'pending' | 'completed' | 'disputed' | 'cancelled';

export type P2POfferStatus = 'active' | 'inactive' | 'completed';

export type P2PPaymentVerificationStatus = 'pending' | 'verified' | 'rejected';

export interface P2PTransaction {
  id: string;
  offerId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  status: P2PTransactionStatus;
  createdAt: string;
  completedAt?: string;
  disputeReason?: string;
}

export interface P2POffer {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  price: number;
  paymentMethod: string;
  status: P2POfferStatus;
  createdAt: string;
  expiresAt?: string;
}

export interface P2PPaymentVerification {
  id: string;
  transactionId: string;
  userId: string;
  status: P2PPaymentVerificationStatus;
  proof: string; // URL to payment proof image
  notes?: string;
  createdAt: string;
  verifiedAt?: string;
}