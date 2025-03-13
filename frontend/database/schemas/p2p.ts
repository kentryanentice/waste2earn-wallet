import { RxJsonSchema } from 'rxdb';
import { Order, PaymentVerification } from '../../types/p2p';

export const orderSchema: RxJsonSchema<Order> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    sellerId: {
      type: 'string',
      maxLength: 100
    },
    amount: {
      type: 'number'
    },
    price: {
      type: 'number'
    },
    status: {
      type: 'string',
      enum: ['open', 'pending', 'completed', 'disputed', 'cancelled']
    },
    createdAt: {
      type: 'string',
      format: 'date-time'
    },
    expiresAt: {
      type: 'string',
      format: 'date-time'
    },
    paymentMethod: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        type: { 
          type: 'string',
          enum: ['bank', 'gcash', 'maya', 'coins.ph']
        },
        details: {
          type: 'object',
          properties: {
            accountNumber: { type: 'string' },
            accountName: { type: 'string' },
            bankName: { type: 'string' },
            walletAddress: { type: 'string' }
          }
        }
      }
    },
    escrowId: {
      type: 'string',
      maxLength: 100
    }
  },
  required: ['id', 'sellerId', 'amount', 'price', 'status', 'createdAt', 'expiresAt', 'paymentMethod']
};

export const paymentVerificationSchema: RxJsonSchema<PaymentVerification> = {
  version: 0,
  primaryKey: 'orderId',
  type: 'object',
  properties: {
    orderId: {
      type: 'string',
      maxLength: 100
    },
    status: {
      type: 'string',
      enum: ['pending', 'verified', 'rejected']
    },
    proof: {
      type: 'string',
      maxLength: 1000
    },
    verifiedAt: {
      type: 'string',
      format: 'date-time'
    },
    verifiedBy: {
      type: 'string',
      maxLength: 100
    }
  },
  required: ['orderId', 'status']
}; 