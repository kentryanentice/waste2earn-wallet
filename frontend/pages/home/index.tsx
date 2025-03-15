import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CustomButton } from "@components/button";
import { clsx } from "clsx";
import "./style.scss";
import AssetsList from "./components/ICRC/asset";
import DetailList from "./components/ICRC/transaction";
import KYCRegistration from "./components/KYCRegistration";

const Home = () => {
  const { t } = useTranslation();
  const [showKYCRegistration, setShowKYCRegistration] = useState(false);

  return (
    <div className="flex flex-col w-full space-y-3">
      <div className="flex justify-center px-4 py-4">
        <CustomButton
          className={clsx(
            "bg-slate-color-success text-white px-6 py-2",
            "hover:bg-slate-color-success/90 transition-colors duration-200"
          )}
          onClick={() => setShowKYCRegistration(true)}
        >
          {t("Complete KYC Registration")}
        </CustomButton>
      </div>
      <DetailList />
      <AssetsList />
      {showKYCRegistration && (
        <KYCRegistration onClose={() => setShowKYCRegistration(false)} />
      )}
    </div>
  );
};

export default Home;
