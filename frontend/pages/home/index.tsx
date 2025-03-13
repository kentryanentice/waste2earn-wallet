import "./style.scss";
import AssetsList from "./components/ICRC/asset";
import DetailList from "./components/ICRC/transaction";
import { CustomButton } from "@components/button";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import TopUpModal from "./components/TopUpModal";
import { Order } from "@/types/p2p";
import { p2pService } from "@/services/p2p";

const Home = () => {
  const { t } = useTranslation();
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  const handleAcceptOrder = async (order: Order) => {
    try {
      // 1. Lock tokens in escrow
      await p2pService.lockTokensInEscrow(order);
      
      // 2. Show payment instructions
      // This will be handled in the TopUpModal component
      
      // 3. Start payment verification
      await p2pService.createPaymentVerification({
        orderId: order.id,
        proof: "", // This will be filled by the user
      });
      
      // 4. Update order status
      await p2pService.updateOrderStatus(order.id, "pending");
    } catch (error) {
      console.error("Failed to process order:", error);
    }
  };

  return (
    <div className="flex flex-col w-full space-y-20">
      <div className="flex justify-end px-4 md:px-[2.25rem]">
        <CustomButton 
          className="bg-slate-color-success text-white px-6 py-2 rounded-lg hover:bg-slate-color-success/90 transition-colors"
          onClick={() => setShowTopUpModal(true)}
        >
          {t("top.up")}
        </CustomButton>
      </div>
      <DetailList />
      <AssetsList />
      {showTopUpModal && <TopUpModal onClose={() => setShowTopUpModal(false)} />}
      {/* <img src={bckground} width="1900" height="50" alt="atikra" className=""/> */}
    </div>
  );
};

export default Home;
