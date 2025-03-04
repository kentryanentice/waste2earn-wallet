// svgs
// import W2enWalletIcon from "@/assets/svg/files/logo-dark.svg";
// import W2enWalletLightIcon from "@/assets/svg/files/logo-light.svg";
import LoginLogoIcon from "@/assets/svg/files/login-logo.png";
//
// import { ThemeHook } from "@hooks/themeHook";
import { Fragment, useEffect } from "react";
// import { ThemesEnum } from "@/common/const";
import AuthMethods from "@/pages/login/components/AuthMethods";
import { DB_LOCATION_AUTH } from "@pages/components/topbar/dbLocationModal";
import { db, DB_Type } from "@/database/db";
import { useAppDispatch } from "@redux/Store";
import { setDbLocation } from "@redux/auth/AuthReducer";

const Login = () => {
  const dispatch = useAppDispatch();
  // const { theme } = ThemeHook();

  useEffect(() => {
    const lastUserSync = localStorage.getItem(DB_LOCATION_AUTH);
    const toStoreValue = lastUserSync === DB_Type.CANISTER ? DB_Type.CANISTER : DB_Type.LOCAL;
    db().setDbLocation(toStoreValue);
    dispatch(setDbLocation(toStoreValue));
  }, []);

  return (
    <Fragment>
      <div className="flex flex-col sm:flex-row w-full h-full bg-PrimaryColorLight dark:bg-PrimaryColor">
        <div className="flex flex-col h-[100%] justify-center items-center px-[5%] bg-SecondaryColorLight dark:bg-SecondaryColor">
          {/* <img
            src={theme === ThemesEnum.enum.dark ? W2enWalletIcon : W2enWalletLightIcon}
            alt=""
            className="w-full max-w-[20rem]"
          /> */}
          
          <img
            src={LoginLogoIcon}
            alt="Login Logo"
            className="w-full max-w-[25rem]"
          />
        </div>
        <AuthMethods />
      </div>
    </Fragment>
  );
};

export default Login;
