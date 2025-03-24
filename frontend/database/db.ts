import { RxdbDatabase } from "@/database/rxdb";
import { IWalletDatabase } from "@/database/i-wallet-database";
import { LocalStorageDatabase } from "@/database/local-storage";
import { LocalRxdbDatabase } from "@/database/local-rxdb";

export enum DB_Type {
  LOCAL = "local",
  CANISTER = "rxdb",
  LOCAL_RXDB = "local_rxdb",
}

export const localDb = () => LocalStorageDatabase.instance;

export const rxDb = () => RxdbDatabase.instance;

export const db: () => IWalletDatabase = () => {
  const dbLocation = localStorage.getItem("dbLocation");
  if (dbLocation === DB_Type.CANISTER) {
    return rxDb();
  } else if (dbLocation === DB_Type.LOCAL_RXDB) {
    return LocalRxdbDatabase.instance;
  } else {
    return localDb();
  }
};
