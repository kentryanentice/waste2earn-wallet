import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { BasicModal } from "@components/modal";
import { CustomButton } from "@components/button";
import { CustomInput } from "@components/input";
import { ReactComponent as CloseIcon } from "@assets/svg/files/close.svg";
import { ReactComponent as AttachmentIcon } from "@assets/svg/files/attachment-icon.svg";
import { ReactComponent as GcashIcon } from "@assets/svg/files/gcash.svg";
import { ReactComponent as PaymayaIcon } from "@assets/svg/files/paymaya.svg";
import { ReactComponent as BpiIcon } from "@assets/svg/files/bpi.svg";
import { clsx } from "clsx";
import { useAppSelector } from "@redux/Store";
import { Order, PaymentMethod } from "@/types/p2p";
import { p2pService } from "@/services/p2p";
import { LoadingLoader } from "@components/loader";
import PaymentInstructions from "./PaymentInstructions";
import ValidatorRegistration from './ValidatorRegistration';

interface Validator {
  id: string;
  name: string;
  isActive: boolean;
  rating: number;
  responseTime: string;
  totalOrders: number;
  avatarUrl?: string;
}

interface Message {
  id: string;
  type: 'order' | 'message' | 'payment' | 'image';
  content: string;
  sender: 'validator' | 'user';
  timestamp: Date;
  orderDetails?: Order;
  isNew?: boolean;
  imageUrl?: string;
  validatorId?: string;
}

interface PaymentDetails {
  gcash: string;
  paymaya: string;
  bpi: string;
}

const PAYMENT_DETAILS: PaymentDetails = {
  gcash: "+639157330436",
  paymaya: "+639157330436",
  bpi: "2889058032"
};

interface TopUpModalProps {
  onClose: () => void;
}

// Updated mock validators data with more details
const VALIDATORS: Validator[] = [
  { 
    id: 'v1', 
    name: 'John Validator', 
    isActive: true,
    rating: 4.8,
    responseTime: '< 5 min',
    totalOrders: 156,
    avatarUrl: 'https://ui-avatars.com/api/?name=John+Validator'
  },
  { 
    id: 'v2', 
    name: 'Maria Handler', 
    isActive: true,
    rating: 4.9,
    responseTime: '< 2 min',
    totalOrders: 243,
    avatarUrl: 'https://ui-avatars.com/api/?name=Maria+Handler'
  }
  // { 
  //   id: 'v3', 
  //   name: 'Peter Support', 
  //   isActive: false,
  //   rating: 4.7,
  //   responseTime: '< 10 min',
  //   totalOrders: 89,
  //   avatarUrl: 'https://ui-avatars.com/api/?name=Peter+Support'
  // },
  // { 
  //   id: 'v4', 
  //   name: 'Sarah Assist', 
  //   isActive: true,
  //   rating: 5.0,
  //   responseTime: '< 1 min',
  //   totalOrders: 312,
  //   avatarUrl: 'https://ui-avatars.com/api/?name=Sarah+Assist'
  // },
];

interface PaymentMethodIcon {
  id: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const PAYMENT_METHOD_ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  gcash: GcashIcon,
  maya: PaymayaIcon,
  bpi: BpiIcon,
};

const ESCROW_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MIN_ORDER_AMOUNT = 1; // Minimum WASTE token amount
const MAX_ORDER_AMOUNT = 10000; // Maximum WASTE token amount

// Add new constants for enhanced escrow features
const ORDER_SIZE_TIERS = {
  SMALL: { max: 100, timeout: 12 * 60 * 60 * 1000 }, // 12 hours for orders <= 100 WASTE
  MEDIUM: { max: 1000, timeout: 24 * 60 * 60 * 1000 }, // 24 hours for orders <= 1000 WASTE
  LARGE: { max: 5000, timeout: 48 * 60 * 60 * 1000 }, // 48 hours for orders <= 5000 WASTE
  XLARGE: { max: 10000, timeout: 72 * 60 * 60 * 1000 }, // 72 hours for orders > 5000 WASTE
};

const RATE_LIMIT = {
  MAX_ORDERS_PER_HOUR: 5,
  MAX_ORDERS_PER_DAY: 20,
  COOLDOWN_PERIOD: 5 * 60 * 1000, // 5 minutes between orders
};

const ORDER_STATUS_TRACKING = {
  CREATED: "created",
  ESCROW_PENDING: "escrow_pending",
  ESCROW_LOCKED: "escrow_locked",
  PAYMENT_PENDING: "payment_pending",
  PAYMENT_SUBMITTED: "payment_submitted",
  PAYMENT_VERIFIED: "payment_verified",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  DISPUTED: "disputed",
  REFUNDED: "refunded",
  EXPIRED: "expired"
} as const;

const TopUpModal = ({ onClose }: TopUpModalProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"swap" | "buy">("buy");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("1");
  const [swapFromToken, setSwapFromToken] = useState("WASTE");
  const [swapToToken, setSwapToToken] = useState("USDC");
  const [swapAmount, setSwapAmount] = useState("");
  const [estimatedReceiveAmount, setEstimatedReceiveAmount] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const assets = useAppSelector((state) => state.asset.list.assets);
  const wasteToken = assets.find(asset => asset.tokenSymbol === "WASTE");
  const WASTE_TOKEN_PRICE = 1; // Price per WASTE token in PHP
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedValidator, setSelectedValidator] = useState<string>("");
  const [showValidatorList, setShowValidatorList] = useState(false);
  const [validatorFilter, setValidatorFilter] = useState<'all' | 'active'>('all');
  const [showValidatorRegistration, setShowValidatorRegistration] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    loadOrders();
    loadPaymentMethods();
    scrollToBottom();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const availableOrders = await p2pService.getAvailableOrders();
      setOrders(availableOrders);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const methods = await p2pService.getPaymentMethods();
      setPaymentMethods(methods);
      if (methods.length > 0) {
        setSelectedPaymentMethod(methods[0].id);
      }
    } catch (error) {
      console.error("Failed to load payment methods:", error);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setAmount(newAmount);
    // Automatically calculate price based on amount
    setPrice((parseFloat(newAmount) * WASTE_TOKEN_PRICE).toString());
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMessages(prev => [...prev, {
          id: Math.random().toString(),
          type: 'image',
          content: 'Image attachment',
          sender: 'user',
          timestamp: new Date(),
          imageUrl: reader.result as string,
          isNew: true
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateOrder = async () => {
    if (!amount || !price || !selectedPaymentMethod) return;
    
    try {
      setLoading(true);
      const paymentMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
      if (!paymentMethod) return;

      const newOrder = await p2pService.createOrder({
        sellerId: "current-user-id",
        amount: parseFloat(amount),
        price: parseFloat(price),
        paymentMethod,
      });

      setOrders([...orders, newOrder]);
      
      // Add order message with payment details
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        type: 'order',
        content: `New order created: ${newOrder.amount} WASTE for ${newOrder.price} PHP`,
        sender: 'validator',
        timestamp: new Date(),
        orderDetails: newOrder,
        isNew: true
      }]);

      // Add payment details message
      const paymentNumber = paymentMethod.type === 'gcash' 
        ? PAYMENT_DETAILS.gcash 
        : paymentMethod.type === 'maya' 
          ? PAYMENT_DETAILS.paymaya 
          : PAYMENT_DETAILS.bpi;

      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        type: 'payment',
        content: `Please send payment to ${paymentMethod.name}: ${paymentNumber}`,
        sender: 'validator',
        timestamp: new Date(),
        isNew: true
      }]);

      setAmount("");
      setPrice("");
    } catch (error) {
      console.error("Failed to create order:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (order: Order) => {
    try {
      setLoading(true);

      // 1. Enhanced Order Amount Validation
      if (order.amount < MIN_ORDER_AMOUNT || order.amount > MAX_ORDER_AMOUNT) {
        throw new Error(`Order amount must be between ${MIN_ORDER_AMOUNT} and ${MAX_ORDER_AMOUNT} WASTE`);
      }

      // 2. Rate Limiting Checks
      const userOrders = await p2pService.getOrdersByUser(order.sellerId);
      const lastHourOrders = userOrders.filter(o => 
        new Date(o.createdAt).getTime() > Date.now() - 60 * 60 * 1000
      );
      const lastDayOrders = userOrders.filter(o => 
        new Date(o.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
      );
      const lastOrder = userOrders[userOrders.length - 1];

      if (lastHourOrders.length >= RATE_LIMIT.MAX_ORDERS_PER_HOUR) {
        throw new Error("Hourly order limit reached. Please try again later.");
      }
      if (lastDayOrders.length >= RATE_LIMIT.MAX_ORDERS_PER_DAY) {
        throw new Error("Daily order limit reached. Please try again later.");
      }
      if (lastOrder && Date.now() - new Date(lastOrder.createdAt).getTime() < RATE_LIMIT.COOLDOWN_PERIOD) {
        throw new Error("Please wait a few minutes between orders.");
      }

      // 3. Determine Order Size Tier and Timeout
      let orderTier;
      let escrowTimeout;
      if (order.amount <= ORDER_SIZE_TIERS.SMALL.max) {
        orderTier = "SMALL";
        escrowTimeout = ORDER_SIZE_TIERS.SMALL.timeout;
      } else if (order.amount <= ORDER_SIZE_TIERS.MEDIUM.max) {
        orderTier = "MEDIUM";
        escrowTimeout = ORDER_SIZE_TIERS.MEDIUM.timeout;
      } else if (order.amount <= ORDER_SIZE_TIERS.LARGE.max) {
        orderTier = "LARGE";
        escrowTimeout = ORDER_SIZE_TIERS.LARGE.timeout;
      } else {
        orderTier = "XLARGE";
        escrowTimeout = ORDER_SIZE_TIERS.XLARGE.timeout;
      }

      // 4. Check if order is expired
      const orderAge = Date.now() - new Date(order.createdAt).getTime();
      if (orderAge > escrowTimeout) {
        throw new Error("Order has expired");
      }

      // 5. Check if order is still available and valid
      const currentOrder = await p2pService.getOrderById(order.id);
      if (!currentOrder || currentOrder.status !== "open") {
        throw new Error("Order is no longer available");
      }

      // 6. Update order status to escrow pending
      await p2pService.updateOrderStatus(order.id, ORDER_STATUS_TRACKING.ESCROW_PENDING);

      // 7. Lock tokens in escrow with dynamic timeout
      const escrow = await p2pService.lockTokensInEscrow({
        ...order,
        expiresAt: new Date(Date.now() + escrowTimeout)
      });
      
      if (!escrow) {
        throw new Error("Failed to lock tokens in escrow");
      }

      // 8. Update order status to escrow locked
      await p2pService.updateOrderStatus(order.id, ORDER_STATUS_TRACKING.ESCROW_LOCKED);
      
      // 9. Add detailed escrow confirmation message
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        type: 'message',
        content: `Tokens locked in escrow: ${order.amount} WASTE
Order Tier: ${orderTier}
Escrow Duration: ${escrowTimeout / (60 * 60 * 1000)} hours
Expires: ${new Date(Date.now() + escrowTimeout).toLocaleString()}`,
        sender: 'validator',
        timestamp: new Date(),
        isNew: true
      }]);

      // 10. Add payment instruction message with dynamic timeout
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        type: 'payment',
        content: `Please send ${order.price} PHP to ${order.paymentMethod.name}
Payment window: ${escrowTimeout / (60 * 60 * 1000)} hours
Auto-cancellation if not paid by: ${new Date(Date.now() + escrowTimeout).toLocaleString()}`,
        sender: 'validator',
        timestamp: new Date(),
        isNew: true
      }]);
      
      // 11. Set up escrow timeout handler with status updates
      const timeoutId = setTimeout(async () => {
        const orderStatus = await p2pService.getOrderById(order.id);
        if (orderStatus?.status === ORDER_STATUS_TRACKING.ESCROW_LOCKED || 
            orderStatus?.status === ORDER_STATUS_TRACKING.PAYMENT_PENDING) {
          await p2pService.updateOrderStatus(order.id, ORDER_STATUS_TRACKING.EXPIRED);
          setMessages(prev => [...prev, {
            id: Math.random().toString(),
            type: 'message',
            content: `Order expired. Escrow period of ${escrowTimeout / (60 * 60 * 1000)} hours has elapsed.`,
            sender: 'validator',
            timestamp: new Date(),
            isNew: true
          }]);
        }
      }, escrowTimeout);

      // 12. Show payment instructions and update UI
      setSelectedOrder(order);
      setShowPaymentInstructions(true);
      await loadOrders();

      // Clean up timeout if component unmounts
      return () => clearTimeout(timeoutId);

    } catch (error) {
      console.error("Failed to accept order:", error);
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        type: 'message',
        content: error instanceof Error ? error.message : 'Failed to lock tokens in escrow. Please try again.',
        sender: 'validator',
        timestamp: new Date(),
        isNew: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedOrder) return;
    
    try {
      setLoading(true);
      // Here you would typically:
      // 1. Upload payment proof
      // 2. Create payment verification
      // 3. Update order status
      await p2pService.createPaymentVerification({
        orderId: selectedOrder.id,
        proof: "", // This would be the uploaded proof
      });
      
      setShowPaymentInstructions(false);
      setSelectedOrder(null);
      await loadOrders();
    } catch (error) {
      console.error("Failed to confirm payment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidatorSelect = (validatorId: string) => {
    setSelectedValidator(validatorId);
    setShowValidatorList(false);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    setMessages(prev => [...prev, {
      id: Math.random().toString(),
      type: 'message',
      content: newMessage,
      sender: 'user',
      timestamp: new Date(),
      validatorId: selectedValidator
    }]);

    setNewMessage("");
  };

  const filteredValidators = VALIDATORS.filter(validator => 
    validatorFilter === 'all' || validator.isActive
  );

  const renderValidatorList = () => {
    return (
      <div className="absolute bottom-full mb-2 right-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-BorderColorTwoLight dark:border-BorderColorTwo overflow-hidden">
        <div className="p-3 border-b border-BorderColorTwoLight dark:border-BorderColorTwo">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">{t("Select Validator")}</h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setValidatorFilter('all')}
              className={clsx(
                "text-xs px-2 py-1 rounded",
                validatorFilter === 'all' 
                  ? "bg-slate-color-success text-white" 
                  : "bg-gray-100 dark:bg-gray-700"
              )}
            >
              {t("All")}
            </button>
            <button
              onClick={() => setValidatorFilter('active')}
              className={clsx(
                "text-xs px-2 py-1 rounded",
                validatorFilter === 'active' 
                  ? "bg-slate-color-success text-white" 
                  : "bg-gray-100 dark:bg-gray-700"
              )}
            >
              {t("Active Only")}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {filteredValidators.length} {validatorFilter === 'active' ? 'active ' : ''}validators available
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {filteredValidators.map((validator) => (
            <button
              key={validator.id}
              onClick={() => handleValidatorSelect(validator.id)}
              className={clsx(
                "w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-BorderColorTwoLight dark:border-BorderColorTwo last:border-0",
                selectedValidator === validator.id && "bg-gray-50 dark:bg-gray-700"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <img 
                    src={validator.avatarUrl} 
                    alt={validator.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div 
                    className={clsx(
                      "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800",
                      validator.isActive ? "bg-green-500" : "bg-gray-400"
                    )}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{validator.name}</span>
                    <span className={clsx(
                      "text-xs px-2 py-0.5 rounded",
                      validator.isActive 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
                    )}>
                      {validator.isActive ? t("Active") : t("Inactive")}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <span className="text-yellow-500">★</span>
                      <span className="ml-1">{validator.rating}</span>
                    </div>
                    <span>•</span>
                    <div>{validator.responseTime}</div>
                    <span>•</span>
                    <div>{validator.totalOrders} orders</div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderSelectedValidatorBadge = () => {
    const validator = VALIDATORS.find(v => v.id === selectedValidator);
    if (!validator) return null;

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-color-success text-white rounded-lg">
        <div className="relative">
          <img 
            src={validator.avatarUrl} 
            alt={validator.name}
            className="w-6 h-6 rounded-full"
          />
          <div 
            className={clsx(
              "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-color-success",
              validator.isActive ? "bg-green-500" : "bg-gray-400"
            )}
          />
        </div>
        <span className="text-sm">{validator.name}</span>
        <button 
          onClick={() => setSelectedValidator("")}
          className="ml-1 hover:bg-white/20 rounded-full p-0.5"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const handleConfirmOrder = async (orderId: string) => {
    try {
      setLoading(true);
      // Here you would typically confirm the order in your backend
      await p2pService.updateOrderStatus(orderId, "payment_pending");
      
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        type: 'message',
        content: 'Order confirmed! Please proceed with the payment.',
        sender: 'validator',
        timestamp: new Date(),
        isNew: true
      }]);
    } catch (error) {
      console.error("Failed to confirm order:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      setLoading(true);
      // Here you would typically cancel the order in your backend
      await p2pService.updateOrderStatus(orderId, "cancelled");
      
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        type: 'message',
        content: 'Order cancelled.',
        sender: 'validator',
        timestamp: new Date(),
        isNew: true
      }]);
    } catch (error) {
      console.error("Failed to cancel order:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (message: Message) => {
    const validator = message.validatorId ? VALIDATORS.find(v => v.id === message.validatorId) : null;

    if (message.type === 'order') {
      return (
        <div 
          className={clsx(
            "flex flex-col gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg",
            "transform transition-all duration-500 ease-in-out",
            message.isNew ? "translate-y-0 opacity-100" : "translate-y-0 opacity-100",
            message.isNew ? "animate-slideDown" : ""
          )}
        >
          <div className="font-medium text-slate-color-success">{message.content}</div>
          {message.orderDetails && (
            <>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <div>Amount: {message.orderDetails.amount} WASTE</div>
                <div>Price: {message.orderDetails.price} PHP</div>
                <div>Payment: {message.orderDetails.paymentMethod.name}</div>
              </div>
              <div className="flex gap-2 mt-2">
                <CustomButton
                  className={clsx(
                    "flex-1 bg-slate-color-success text-white text-sm py-1",
                    "hover:bg-slate-color-success/90"
                  )}
                  onClick={() => handleConfirmOrder(message.orderDetails!.id)}
                  disabled={loading}
                >
                  {loading ? <LoadingLoader /> : t("Confirm Order")}
                </CustomButton>
                <CustomButton
                  className={clsx(
                    "flex-1 bg-red-500 text-white text-sm py-1",
                    "hover:bg-red-600"
                  )}
                  onClick={() => handleCancelOrder(message.orderDetails!.id)}
                  disabled={loading}
                >
                  {loading ? <LoadingLoader /> : t("Cancel")}
                </CustomButton>
              </div>
            </>
          )}
        </div>
      );
    }

    if (message.type === 'payment') {
      return (
        <div className={clsx(
          "p-3 rounded-lg max-w-[80%] transform transition-all duration-500 ease-in-out",
          "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800",
          message.isNew ? "animate-slideDown" : ""
        )}>
          <div className="font-medium text-blue-600 dark:text-blue-400">{message.content}</div>
        </div>
      );
    }

    if (message.type === 'image') {
      return (
        <div className={clsx(
          "p-2 rounded-lg max-w-[80%] transform transition-all duration-500 ease-in-out",
          message.sender === 'user' ? "ml-auto" : "",
          message.isNew ? "animate-slideDown" : ""
        )}>
          {message.imageUrl && (
            <img 
              src={message.imageUrl} 
              alt="Payment proof" 
              className="max-w-full rounded-lg"
            />
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        {validator && message.sender === 'user' && (
          <div className="text-xs text-gray-500 text-right">
            To: {validator.name}
          </div>
        )}
        <div className={clsx(
          "p-3 rounded-lg max-w-[80%] transform transition-all duration-500 ease-in-out",
          message.sender === 'user' 
            ? "bg-slate-color-success text-white ml-auto" 
            : "bg-gray-100 dark:bg-gray-700",
          message.isNew ? "animate-slideDown" : ""
        )}>
          {message.content}
        </div>
      </div>
    );
  };

  // Add new function to handle token swap
  const handleSwapTokens = () => {
    const temp = swapFromToken;
    setSwapFromToken(swapToToken);
    setSwapToToken(temp);
    setSwapAmount("");
    setEstimatedReceiveAmount("");
  };

  // Add function to calculate estimated receive amount
  const calculateEstimatedAmount = (amount: string) => {
    // This is a placeholder calculation - replace with actual rates
    const rates = {
      'WASTE-USDC': 0.017, // 1 WASTE = 58 USDC
      'WASTE-ICP': 0.003, // 1 WASTE = 0.001 ICP
      'USDC-WASTE': 58, // 1 USDC = 100 WASTE
      'ICP-WASTE': 336.4, // 1 ICP = 1000 WASTE
    };

    const pair = `${swapFromToken}-${swapToToken}`;
    const rate = rates[pair as keyof typeof rates] || 1;
    return (parseFloat(amount) * rate).toFixed(6);
  };

  const handleSwapAmountChange = (value: string) => {
    setSwapAmount(value);
    if (value) {
      setEstimatedReceiveAmount(calculateEstimatedAmount(value));
    } else {
      setEstimatedReceiveAmount("");
    }
  };

  return (
    <BasicModal
      open={true}
      width="w-[30rem]"
      padding="p-4 sm:p-6"
      border="border border-BorderColorTwoLight dark:border-BorderColorTwo"
    >
      <div className="relative flex flex-col w-full gap-4">
        <CloseIcon 
          className={clsx(
            "absolute cursor-pointer top-2 right-2 sm:top-5 sm:right-5",
            "stroke-PrimaryTextColorLight dark:stroke-PrimaryTextColor"
          )} 
          onClick={onClose} 
        />

        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">{t("P2P Exchange")}</h2>
          
          {showPaymentInstructions && selectedOrder ? (
            <PaymentInstructions
              order={selectedOrder}
              onClose={handleConfirmPayment}
            />
          ) : (
            <>
              {/* Tab Navigation */}
              <div className="flex gap-2 border-b border-BorderColorTwoLight dark:border-BorderColorTwo">
                <button
                  className={clsx(
                    "px-4 py-2",
                    activeTab === "swap" 
                      ? "border-b-2 border-slate-color-success text-slate-color-success"
                      : "text-gray-500"
                  )}
                  onClick={() => setActiveTab("swap")}
                >
                  {t("Swap Tokens")}
                </button>
                <button
                  className={clsx(
                    "px-4 py-2",
                    activeTab === "buy"
                      ? "border-b-2 border-slate-color-success text-slate-color-success"
                      : "text-gray-500"
                  )}
                  onClick={() => setActiveTab("buy")}
                >
                  {t("Buy")}
                </button>
              </div>

              {/* Swap Interface */}
              {activeTab === "swap" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">{t("You Pay")}</label>
                    <div className="relative">
                      <CustomInput
                        type="number"
                        value={swapAmount}
                        onChange={(e) => handleSwapAmountChange(e.target.value)}
                        placeholder="0.00"
                      />
                      <select
                        value={swapFromToken}
                        onChange={(e) => setSwapFromToken(e.target.value)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border border-BorderColorTwoLight dark:border-BorderColorTwo rounded px-2 py-1"
                      >
                        <option value="WASTE">WASTE</option>
                        <option value="USDC">USDC</option>
                        <option value="ICP">ICP</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleSwapTokens}
                    className="self-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m-4 4v8m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">{t("You Receive")}</label>
                    <div className="relative">
                      <CustomInput
                        type="number"
                        value={estimatedReceiveAmount}
                        disabled
                        placeholder="0.00"
                      />
                      <select
                        value={swapToToken}
                        onChange={(e) => setSwapToToken(e.target.value)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border border-BorderColorTwoLight dark:border-BorderColorTwo rounded px-2 py-1"
                      >
                        <option value="USDC">USDC</option>
                        <option value="ICP">ICP</option>
                        <option value="WASTE">WASTE</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex justify-between mb-1">
                      <span>{t("Exchange Rate")}:</span>
                      <span>1 {swapFromToken} = {calculateEstimatedAmount("1")} {swapToToken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("Network Fee")}:</span>
                      <span>0.001 {swapToToken}</span>
                    </div>
                  </div>

                  <CustomButton
                    className={clsx(
                      "bg-slate-color-success text-black transition-all duration-300",
                      "hover:bg-slate-color-success/90 active:scale-95"
                    )}
                    onClick={() => {}}
                    disabled={!swapAmount || parseFloat(swapAmount) <= 0}
                  >
                    {t("Swap Tokens")}
                  </CustomButton>
                </div>
              )}

              {/* Buy Interface */}
              {activeTab === "buy" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">{t("Enter Waste Token")}</label>
                    <CustomInput
                      type="number"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder={t("Waste Token Amount")}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">{t("Peso Equivalent")}</label>
                    <CustomInput
                      type="number"
                      value={price}
                      disabled
                      placeholder={t("Php Amount")}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">{t("Payment Method")}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {paymentMethods.map((method) => {
                        const Icon = PAYMENT_METHOD_ICONS[method.type];
                        return (
                          <button
                            key={method.id}
                            onClick={() => setSelectedPaymentMethod(method.id)}
                            className={clsx(
                              "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                              selectedPaymentMethod === method.id
                                ? "border-slate-color-success bg-slate-color-success/5"
                                : "border-BorderColorTwoLight dark:border-BorderColorTwo hover:border-slate-color-success/50"
                            )}
                          >
                            {Icon && (
                              <div className="w-8 h-8">
                                <Icon className="w-full h-full" />
                              </div>
                            )}
                            <span className="text-sm font-medium">{method.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <CustomButton
                    className={clsx(
                      "bg-slate-color-success text-black transition-all duration-300",
                      "hover:bg-slate-color-success/90 active:scale-95"
                    )}
                    onClick={handleCreateOrder}
                    disabled={loading}
                  >
                    {loading ? <LoadingLoader /> : t("Create an Order")}
                  </CustomButton>

                  {/* Chat Interface */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">{t("Online Chat")}</h3>
                      <div className="relative">
                        {selectedValidator ? (
                          renderSelectedValidatorBadge()
                        ) : (
                          <CustomButton
                            className={clsx(
                              "text-sm px-3 py-1.5",
                              "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
                              "hover:bg-gray-200 dark:hover:bg-gray-600"
                            )}
                            onClick={() => setShowValidatorList(!showValidatorList)}
                          >
                            {t("Select Validator")}
                          </CustomButton>
                        )}
                        {showValidatorList && renderValidatorList()}
                      </div>
                    </div>
                    <div className="flex flex-col h-[300px] border border-BorderColorTwoLight dark:border-BorderColorTwo rounded-lg overflow-hidden">
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => (
                          <div 
                            key={message.id} 
                            className={clsx(
                              "flex transform transition-all duration-500 ease-in-out",
                              message.sender === 'user' ? "justify-end" : "justify-start",
                              message.isNew ? "animate-slideDown" : ""
                            )}
                          >
                            {renderMessage(message)}
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                      <div className="p-4 border-t border-BorderColorTwoLight dark:border-BorderColorTwo">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <CustomInput
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder={selectedValidator 
                                ? t("Type your message...") 
                                : t("Select a validator to start chatting...")}
                              disabled={!selectedValidator}
                              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageSelect}
                            />
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                              disabled={!selectedValidator}
                            >
                              <AttachmentIcon className="w-5 h-5" />
                            </button>
                          </div>
                          <CustomButton
                            className="bg-slate-color-success text-white"
                            onClick={handleSendMessage}
                            disabled={!selectedValidator}
                          >
                            {t("Send")}
                          </CustomButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {showValidatorRegistration && (
        <ValidatorRegistration
          onClose={() => setShowValidatorRegistration(false)}
        />
      )}
    </BasicModal>
  );
};

export default TopUpModal; 