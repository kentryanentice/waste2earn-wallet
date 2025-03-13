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

export type OrderStatus = "open" | "pending" | "completed" | "disputed" | "cancelled";

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