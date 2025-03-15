import { useTranslation } from "react-i18next";
import { Order } from "@/types/p2p";
import { CustomButton } from "@components/button";
import { ReactComponent as CopyIcon } from "@assets/svg/files/copy-icon.svg";
import { useState } from "react";

interface PaymentInstructionsProps {
  order: Order;
  onClose: () => void;
}

const PaymentInstructions = ({ order, onClose }: PaymentInstructionsProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPaymentDetails = () => {
    const { paymentMethod } = order;
    switch (paymentMethod.type) {
      case "gcash":
      case "maya":
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t("wallet.address")}</span>
              <button
                onClick={() => handleCopy(paymentMethod.details.walletAddress || "")}
                className="flex items-center gap-1 text-slate-color-success"
              >
                <CopyIcon className="w-4 h-4" />
                <span className="text-sm">{copied ? t("copied") : t("copy")}</span>
              </button>
            </div>
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              {paymentMethod.details.walletAddress}
            </div>
          </div>
        );
      case "bank":
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t("bank.details")}</span>
              <button
                onClick={() => handleCopy(
                  `${paymentMethod.details.accountNumber}\n${paymentMethod.details.accountName}\n${paymentMethod.details.bankName}`
                )}
                className="flex items-center gap-1 text-slate-color-success"
              >
                <CopyIcon className="w-4 h-4" />
                <span className="text-sm">{copied ? t("copied") : t("copy")}</span>
              </button>
            </div>
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-1">
              <div>{t("account.number")}: {paymentMethod.details.accountNumber}</div>
              <div>{t("account.name")}: {paymentMethod.details.accountName}</div>
              <div>{t("bank.name")}: {paymentMethod.details.bankName}</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-medium">{t("payment.instructions")}</h3>
      
      <div className="flex flex-col gap-4 p-4 border border-BorderColorTwoLight dark:border-BorderColorTwo rounded-lg">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t("amount.to.pay")}</span>
          <span className="text-xl font-semibold">
            {(order.amount * order.price).toFixed(2)} PHP
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t("payment.method")}</span>
          <span className="text-lg">{order.paymentMethod.name}</span>
        </div>

        {getPaymentDetails()}

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t("reference.number")}</span>
          <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <span>{order.id}</span>
            <button
              onClick={() => handleCopy(order.id)}
              className="flex items-center gap-1 text-slate-color-success"
            >
              <CopyIcon className="w-4 h-4" />
              <span className="text-sm">{copied ? t("copied") : t("copy")}</span>
            </button>
          </div>
        </div>

        <div className="mt-4">
          <CustomButton
            className="w-full bg-slate-color-success text-white"
            onClick={onClose}
          >
            {t("confirm.payment")}
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default PaymentInstructions; 