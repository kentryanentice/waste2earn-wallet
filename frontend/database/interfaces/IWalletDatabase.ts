import { Order, Escrow, PaymentVerification } from "@/types/p2p";

export interface IWalletDatabase {
  // ... existing methods ...

  // P2P Exchange Methods
  addOrder(order: Order): Promise<void>;
  getOpenOrders(): Promise<Order[]>;
  getOrderById(orderId: string): Promise<Order | null>;
  updateOrderStatus(orderId: string, status: Order["status"]): Promise<void>;
  
  addEscrow(escrow: Escrow): Promise<void>;
  getEscrowByOrderId(orderId: string): Promise<Escrow | null>;
  
  addPaymentVerification(verification: PaymentVerification): Promise<void>;
  getPaymentVerificationByOrderId(orderId: string): Promise<PaymentVerification | null>;
} 