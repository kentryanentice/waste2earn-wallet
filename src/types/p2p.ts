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