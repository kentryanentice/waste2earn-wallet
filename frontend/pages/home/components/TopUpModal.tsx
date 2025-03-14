import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { BasicModal } from "@components/modal";
import { CustomButton } from "@components/button";
import { CustomInput } from "@components/input";
import { ReactComponent as CloseIcon } from "@assets/svg/files/close.svg";
import { ReactComponent as AttachmentIcon } from "@assets/svg/files/attachment-icon.svg";
import { clsx } from "clsx";
import { useAppSelector } from "@redux/Store";
import { Order, PaymentMethod } from "@/types/p2p";
import { p2pService } from "@/services/p2p";
import { LoadingLoader } from "@components/loader";
import PaymentInstructions from "./PaymentInstructions";

interface Message {
  id: string;
  type: 'order' | 'message' | 'payment' | 'image';
  content: string;
  sender: 'validator' | 'user';
  timestamp: Date;
  orderDetails?: Order;
  isNew?: boolean;
  imageUrl?: string;
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

const TopUpModal = ({ onClose }: TopUpModalProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("1");
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
      // 1. Lock tokens in escrow
      await p2pService.lockTokensInEscrow(order);
      
      // 2. Update order status
      await p2pService.updateOrderStatus(order.id, "pending");
      
      // 3. Show payment instructions
      setSelectedOrder(order);
      setShowPaymentInstructions(true);
      
      // 4. Refresh orders
      await loadOrders();
    } catch (error) {
      console.error("Failed to accept order:", error);
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

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    setMessages(prev => [...prev, {
      id: Math.random().toString(),
      type: 'message',
      content: newMessage,
      sender: 'user',
      timestamp: new Date()
    }]);

    setNewMessage("");
  };

  const renderMessage = (message: Message) => {
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
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <div>Amount: {message.orderDetails.amount} WASTE</div>
              <div>Price: {message.orderDetails.price} PHP</div>
              <div>Payment: {message.orderDetails.paymentMethod.name}</div>
            </div>
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
      <div className={clsx(
        "p-3 rounded-lg max-w-[80%] transform transition-all duration-500 ease-in-out",
        message.sender === 'user' 
          ? "bg-slate-color-success text-white ml-auto" 
          : "bg-gray-100 dark:bg-gray-700",
        message.isNew ? "animate-slideDown" : ""
      )}>
        {message.content}
      </div>
    );
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
                    activeTab === "buy" 
                      ? "border-b-2 border-slate-color-success text-slate-color-success"
                      : "text-gray-500"
                  )}
                  onClick={() => setActiveTab("buy")}
                >
                  {t("Sell")}
                </button>
                <button
                  className={clsx(
                    "px-4 py-2",
                    activeTab === "sell"
                      ? "border-b-2 border-slate-color-success text-slate-color-success"
                      : "text-gray-500"
                  )}
                  onClick={() => setActiveTab("sell")}
                >
                  {t("Buy")}
                </button>
              </div>

              {/* Order Form */}
              {activeTab === "sell" && (
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
                    <select
                      className="w-full p-2 border border-BorderColorTwoLight dark:border-BorderColorTwo rounded-lg bg-transparent"
                      value={selectedPaymentMethod}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    >
                      {paymentMethods.map((method) => (
                        <option key={method.id} value={method.id}>
                          {method.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <CustomButton
                    className={clsx(
                      "bg-slate-color-success text-white transition-all duration-300",
                      "hover:bg-slate-color-success/90 active:scale-95"
                    )}
                    onClick={handleCreateOrder}
                    disabled={loading}
                  >
                    {loading ? <LoadingLoader /> : t("Create an Order")}
                  </CustomButton>
                </div>
              )}

              {/* Chat Interface */}
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-medium">{t("Online Chat")}</h3>
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
                          placeholder={t("Type your message...")}
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
                        >
                          <AttachmentIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <CustomButton
                        className="bg-slate-color-success text-white"
                        onClick={handleSendMessage}
                      >
                        {t("Send")}
                      </CustomButton>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </BasicModal>
  );
};

export default TopUpModal; 