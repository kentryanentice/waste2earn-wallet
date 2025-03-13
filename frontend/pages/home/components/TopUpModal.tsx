import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BasicModal } from "@components/modal";
import { CustomButton } from "@components/button";
import { CustomInput } from "@components/input";
import { ReactComponent as CloseIcon } from "@assets/svg/files/close.svg";
import { clsx } from "clsx";
import { useAppSelector } from "@redux/Store";
import { Order, PaymentMethod } from "@/types/p2p";
import { p2pService } from "@/services/p2p";
import { LoadingLoader } from "@components/loader";
import PaymentInstructions from "./PaymentInstructions";

interface TopUpModalProps {
  onClose: () => void;
}

const TopUpModal = ({ onClose }: TopUpModalProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);
  const assets = useAppSelector((state) => state.asset.list.assets);
  const wasteToken = assets.find(asset => asset.tokenSymbol === "WASTE");

  useEffect(() => {
    loadOrders();
    loadPaymentMethods();
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

  const handleCreateOrder = async () => {
    if (!amount || !price || !selectedPaymentMethod) return;
    
    try {
      setLoading(true);
      const paymentMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
      if (!paymentMethod) return;

      const newOrder = await p2pService.createOrder({
        sellerId: "current-user-id", // Replace with actual user ID
        amount: parseFloat(amount),
        price: parseFloat(price),
        paymentMethod,
      });

      setOrders([...orders, newOrder]);
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

  return (
    <BasicModal
      open={true}
      width="w-[95%] sm:w-[80%] md:w-[60%] lg:w-[48rem]"
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
          <h2 className="text-xl font-semibold">{t("p2p.exchange")}</h2>
          
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
                  {t("buy.tokens")}
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
                  {t("sell.tokens")}
                </button>
              </div>

              {/* Order Form */}
              {activeTab === "sell" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">{t("amount.waste")}</label>
                    <CustomInput
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={t("enter.amount")}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">{t("price.php")}</label>
                    <CustomInput
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder={t("enter.price")}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">{t("payment.methods")}</label>
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
                    className="bg-slate-color-success text-white"
                    onClick={handleCreateOrder}
                    disabled={loading}
                  >
                    {loading ? <LoadingLoader /> : t("create.order")}
                  </CustomButton>
                </div>
              )}

              {/* Order List */}
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-medium">{t("available.orders")}</h3>
                <div className="flex flex-col gap-2">
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <LoadingLoader />
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 border border-BorderColorTwoLight dark:border-BorderColorTwo rounded-lg"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{order.amount} WASTE</span>
                          <span className="text-sm text-gray-500">
                            {order.price} PHP per token
                          </span>
                          <span className="text-xs text-gray-400">
                            {order.paymentMethod.name}
                          </span>
                        </div>
                        {activeTab === "buy" && (
                          <CustomButton
                            className="bg-slate-color-success text-white"
                            onClick={() => handleAcceptOrder(order)}
                            disabled={loading}
                          >
                            {t("accept.order")}
                          </CustomButton>
                        )}
                      </div>
                    ))
                  )}
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