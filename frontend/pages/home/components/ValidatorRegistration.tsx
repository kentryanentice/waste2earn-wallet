import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { BasicModal } from "@components/modal";
import { CustomButton } from "@components/button";
import { CustomInput } from "@components/input";
import { ReactComponent as CloseIcon } from "@assets/svg/files/close.svg";
import { clsx } from "clsx";
import { useAppSelector } from "@redux/Store";

interface ValidatorRegistrationProps {
  onClose: () => void;
}

interface RegistrationForm {
  firstName: string;
  middleName: string;
  lastName: string;
  location: string;
  birthday: string;
  bankDetails: {
    gcash: string;
    paymaya: string;
    bpi: {
      accountNumber: string;
      accountName: string;
    };
  };
}

const ValidatorRegistration: React.FC<ValidatorRegistrationProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { userPrincipal } = useAppSelector((state) => state.auth);
  const [form, setForm] = useState<RegistrationForm>({
    firstName: '',
    middleName: '',
    lastName: '',
    location: '',
    birthday: '',
    bankDetails: {
      gcash: '',
      paymaya: '',
      bpi: {
        accountNumber: '',
        accountName: ''
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement validator registration logic
    console.log('Form submitted:', form);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setForm(prev => {
        const parentObj = prev[parent as keyof RegistrationForm] as any;
        return {
          ...prev,
          [parent]: {
            ...parentObj,
            [child]: value
          }
        };
      });
    } else {
      setForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <BasicModal
      open={true}
      width="w-[95%] sm:w-[40rem]"
      padding="p-4 sm:p-6"
      border="border border-BorderColorTwoLight dark:border-BorderColorTwo"
    >
      <div className="relative flex flex-col w-full gap-4 sm:gap-6">
        <CloseIcon
          className={clsx(
            "absolute cursor-pointer top-0 right-0 p-2",
            "stroke-PrimaryTextColorLight dark:stroke-PrimaryTextColor",
            "hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          )}
          onClick={onClose}
        />

        <div className="flex flex-col gap-4">
          <h2 className="text-xl sm:text-2xl font-semibold pr-8">{t("Validator Registration")}</h2>

          <div className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t("Account Identity")}
            </h3>
            <p className="text-base sm:text-lg font-mono mt-1 break-all">{userPrincipal?.toString()}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">{t("First Name")}</label>
                <CustomInput
                  required
                  type="text"
                  value={form.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">{t("Middle Name")}</label>
                <CustomInput
                  type="text"
                  value={form.middleName}
                  onChange={(e) => handleInputChange('middleName', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">{t("Last Name")}</label>
                <CustomInput
                  required
                  type="text"
                  value={form.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                />
              </div>
            </div>

            {/* Location and Birthday */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">{t("Location")}</label>
                <CustomInput
                  required
                  type="text"
                  value={form.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder={t("City, Province")}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">{t("Birthday")}</label>
                <CustomInput
                  required
                  type="date"
                  value={form.birthday}
                  onChange={(e) => handleInputChange('birthday', e.target.value)}
                />
              </div>
            </div>

            {/* Bank Details */}
            <div className="flex flex-col gap-4">
              <h3 className="text-base sm:text-lg font-medium">{t("Payment Details")}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">{t("GCash Number")}</label>
                  <CustomInput
                    type="text"
                    value={form.bankDetails.gcash}
                    onChange={(e) => handleInputChange('bankDetails.gcash', e.target.value)}
                    placeholder="+63"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">{t("Maya Number")}</label>
                  <CustomInput
                    type="text"
                    value={form.bankDetails.paymaya}
                    onChange={(e) => handleInputChange('bankDetails.paymaya', e.target.value)}
                    placeholder="+63"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 p-3 sm:p-4 border border-BorderColorTwoLight dark:border-BorderColorTwo rounded-lg">
                <h4 className="text-sm font-medium">{t("BPI Account Details")}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">{t("Account Number")}</label>
                    <CustomInput
                      type="text"
                      value={form.bankDetails.bpi.accountNumber}
                      onChange={(e) => handleInputChange('bankDetails.bpi.accountNumber', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">{t("Account Name")}</label>
                    <CustomInput
                      type="text"
                      value={form.bankDetails.bpi.accountName}
                      onChange={(e) => handleInputChange('bankDetails.bpi.accountName', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <CustomButton
              type="submit"
              className={clsx(
                "bg-slate-color-success text-white mt-2 sm:mt-4 w-full sm:w-auto sm:self-end px-6",
                "hover:bg-slate-color-success/90 transition-colors duration-200"
              )}
            >
              {t("Register as Validator")}
            </CustomButton>
          </form>
        </div>
      </div>
    </BasicModal>
  );
};

export default ValidatorRegistration; 