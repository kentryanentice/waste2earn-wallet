import { DatabaseOptions, IWalletDatabase } from "./i-wallet-database";
import { createRxDatabase, RxCollection, RxDocument, RxDatabase, addRxPlugin } from "rxdb";
import DBSchemas from "./schemas.json";
import { extractValueFromArray } from "./helpers";
import { defaultTokens } from "@common/defaultTokens";
// rxdb plugins
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBMigrationPlugin } from "rxdb/plugins/migration";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
// types
import { TAllowance } from "../@types/allowance";
import { SupportedStandardEnum } from "../@types/icrc";
import {
  AssetDocument as AssetRxdbDocument,
  ContactDocument as ContactRxdbDocument,
  AllowanceDocument as AllowanceRxdbDocument,
  ServiceDocument as ServiceRxdbDocument,
} from "@candid/database/db.did";
import { Asset } from "@redux/models/AccountModels";
import store from "@redux/Store";
import {
  addReduxAsset,
  deleteReduxAsset,
  setAccordionAssetIdx,
  setAssets,
  updateReduxAsset,
} from "@redux/assets/AssetReducer";
import {
  addReduxContact,
  deleteReduxContact,
  setReduxContacts,
  updateReduxContact,
} from "@redux/contacts/ContactsReducer";
import {
  addReduxAllowance,
  deleteReduxAllowance,
  setReduxAllowances,
  updateReduxAllowance,
} from "@redux/allowance/AllowanceReducer";
import logger from "@common/utils/logger";
import { Contact } from "@redux/models/ContactsModels";
import { ServiceData } from "@redux/models/ServiceModels";
import { setServices as setServicesRedux, setServicesData } from "@redux/services/ServiceReducer";
import { Identity } from "@dfinity/agent";
import { Order, PaymentVerification } from "../types/p2p";
import { KYCDetails } from "../@types/kyc";

addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBMigrationPlugin);
addRxPlugin(RxDBDevModePlugin);

export class LocalRxdbDatabase extends IWalletDatabase {
  // Singleton pattern
  private static _instance: LocalRxdbDatabase | undefined;
  public static get instance(): LocalRxdbDatabase {
    if (!this._instance) {
      this._instance = new LocalRxdbDatabase();
    }
    return this._instance!;
  }

  private principalId = "";
  private db!: RxDatabase;

  private _assets!: RxCollection<AssetRxdbDocument> | null;
  private _contacts!: RxCollection<ContactRxdbDocument> | null;
  private _allowances!: RxCollection<AllowanceRxdbDocument> | null;
  private _services!: RxCollection<ServiceRxdbDocument> | null;
  private _orders!: RxCollection<Order> | null;
  private _paymentVerifications!: RxCollection<PaymentVerification> | null;
  private _kycDetails!: RxCollection<KYCDetails> | null;

  private constructor() {
    super();
    this._assets = null;
    this._contacts = null;
    this._allowances = null;
    this._services = null;
    this._orders = null;
    this._paymentVerifications = null;
    this._kycDetails = null;
  }

  async setIdentity(identity: Identity | null): Promise<void> {
    this._invalidateDb();
    this.principalId = identity?.getPrincipal().toString() || "";
    await this.init();
    await this._assetStateSync();
    await this._contactStateSync();
    await this._allowanceStateSync();
    await this._serviceStateSync();
  }

  protected get assets(): Promise<RxCollection<AssetRxdbDocument> | null> {
    if (this._assets) return Promise.resolve(this._assets);
    return this.init().then(() => this._assets);
  }

  protected get contacts(): Promise<RxCollection<ContactRxdbDocument> | null> {
    if (this._contacts) return Promise.resolve(this._contacts);
    return this.init().then(() => this._contacts);
  }

  protected get allowances(): Promise<RxCollection<AllowanceRxdbDocument> | null> {
    if (this._allowances) return Promise.resolve(this._allowances);
    return this.init().then(() => this._allowances);
  }

  protected get services(): Promise<RxCollection<ServiceRxdbDocument> | null> {
    if (this._services) return Promise.resolve(this._services);
    return this.init().then(() => this._services);
  }

  protected get orders(): Promise<RxCollection<Order> | null> {
    if (this._orders) return Promise.resolve(this._orders);
    return this.init().then(() => this._orders);
  }

  protected get paymentVerifications(): Promise<RxCollection<PaymentVerification> | null> {
    if (this._paymentVerifications) return Promise.resolve(this._paymentVerifications);
    return this.init().then(() => this._paymentVerifications);
  }

  protected get kycDetails(): Promise<RxCollection<KYCDetails> | null> {
    if (this._kycDetails) return Promise.resolve(this._kycDetails);
    return this.init().then(() => this._kycDetails);
  }

  async init(): Promise<void> {
    try {
      this.db = await createRxDatabase({
        name: `local_db_${this.principalId}`,
        storage: getRxStorageDexie(),
        ignoreDuplicate: true,
        eventReduce: true,
      });

      const { assets, contacts, allowances, services, p2p_transactions, p2p_payment_verifications, kyc_details } = await this.db.addCollections(DBSchemas);

      this._assets = assets;
      this._contacts = contacts;
      this._allowances = allowances;
      this._services = services;
      this._orders = p2p_transactions;
      this._paymentVerifications = p2p_payment_verifications;
      this._kycDetails = kyc_details;

      // Initialize with default tokens if no assets exist
      const existingAssets = await this._assets.find().exec();
      if (existingAssets.length === 0) {
        await this._assets.bulkInsert(
          defaultTokens.map((dT) => ({
            ...dT,
            index: extractValueFromArray(dT.index),
            logo: extractValueFromArray(dT.logo),
            deleted: false,
            updatedAt: Date.now(),
          })),
        );
      }
    } catch (e) {
      logger.debug("LocalRxDb Init:", e);
    }
  }

  async getAsset(address: string): Promise<Asset | null> {
    try {
      const doc = await (await this.assets)?.findOne(address).exec();
      return (doc && this._mapAssetDoc(doc)) || null;
    } catch (e) {
      logger.debug("LocalRxDb GetAsset:", e);
      return null;
    }
  }

  async getAssets(): Promise<Asset[]> {
    try {
      const documents = await (await this.assets)?.find().exec();
      return (documents && documents.map(this._mapAssetDoc)) || [];
    } catch (e) {
      logger.debug("LocalRxDb GetAssets:", e);
      return [];
    }
  }

  private async _assetStateSync(newAssets?: Asset[]): Promise<void> {
    const documents = await (await this.assets)?.find().exec();
    const result = (documents && documents.map(this._mapAssetDoc)) || [];
    const assets = newAssets || result || [];

    const noBalanceAssets = assets.map((asset) => ({
      ...asset,
      subAccounts: asset.subAccounts.map((subaccount) => ({
        ...subaccount,
        amount: "0",
        currency_amount: "0",
      })),
    }));

    store.dispatch(setAssets(noBalanceAssets));
    assets[0]?.tokenSymbol && store.dispatch(setAccordionAssetIdx([assets[0].tokenSymbol]));
  }

  async addAsset(asset: Asset, options?: DatabaseOptions): Promise<void> {
    try {
      await (
        await this.assets
      )?.insert({
        ...asset,
        logo: extractValueFromArray(asset.logo),
        index: extractValueFromArray(asset.index),
        deleted: false,
        updatedAt: Date.now(),
      });

      if (options?.sync) store.dispatch(addReduxAsset(asset));
    } catch (e) {
      logger.debug("LocalRxDb AddAsset:", e);
    }
  }

  async updateAssets(newAssets: Asset[], options?: DatabaseOptions): Promise<void> {
    try {
      await (
        await this.assets
      )?.bulkUpsert(
        newAssets.map((a) => ({
          ...a,
          logo: extractValueFromArray(a.logo),
          index: extractValueFromArray(a.index),
          deleted: false,
          updatedAt: Date.now(),
        })),
      );
      if (options?.sync) await this._assetStateSync();
    } catch (e) {
      logger.debug("LocalRxDb UpdateAssets:", e);
    }
  }

  async updateAsset(address: string, newDoc: Asset, options?: DatabaseOptions): Promise<void> {
    try {
      const document = await (await this.assets)?.findOne(address).exec();
      await document?.patch({
        ...newDoc,
        logo: extractValueFromArray(newDoc.logo),
        index: extractValueFromArray(newDoc.index),
        deleted: false,
        updatedAt: Date.now(),
      });

      if (options?.sync) store.dispatch(updateReduxAsset(newDoc));
    } catch (e) {
      logger.debug("LocalRxDb UpdateAsset:", e);
    }
  }

  async deleteAsset(address: string, options?: DatabaseOptions): Promise<void> {
    try {
      const document = await (await this.assets)?.findOne(address).exec();
      await document?.remove();

      if (options?.sync) store.dispatch(deleteReduxAsset(address));
    } catch (e) {
      logger.debug("LocalRxDb DeleteAsset", e);
    }
  }

  async getContact(principal: string): Promise<Contact | null> {
    try {
      const document = await (await this.contacts)?.findOne(principal).exec();
      return (document && this._mapContactDoc(document)) || null;
    } catch (e) {
      logger.debug("LocalRxDb GetContact", e);
      return null;
    }
  }

  private async _contactStateSync(newContacts?: Contact[]): Promise<void> {
    const documents = await (await this.contacts)?.find().exec();
    const result = (documents && documents.map(this._mapContactDoc)) || [];
    const contacts = newContacts || result || [];
    store.dispatch(setReduxContacts(contacts));
  }

  async getContacts(): Promise<Contact[]> {
    try {
      const documents = await (await this.contacts)?.find().exec();
      return (documents && documents.map(this._mapContactDoc)) || [];
    } catch (e) {
      logger.debug("LocalRxDb GetContacts", e);
      return [];
    }
  }

  async addContact(contact: Contact, options?: DatabaseOptions): Promise<void> {
    try {
      const databaseContact = this._getStorableContact(contact);
      await (
        await this.contacts
      )?.insert({
        ...databaseContact,
        accountIdentifier: extractValueFromArray(databaseContact.accountIdentifier),
        accounts: databaseContact.accounts,
        deleted: false,
        updatedAt: Date.now(),
      });

      if (options?.sync) store.dispatch(addReduxContact(contact));
    } catch (e) {
      logger.debug("LocalRxDb AddContact", e);
    }
  }

  async updateContact(principal: string, newDoc: Contact, options?: DatabaseOptions): Promise<void> {
    try {
      const databaseContact = this._getStorableContact(newDoc);
      const document = await (await this.contacts)?.findOne(principal).exec();

      document?.patch({
        ...databaseContact,
        accountIdentifier: extractValueFromArray(databaseContact.accountIdentifier),
        accounts: databaseContact.accounts,
        deleted: false,
        updatedAt: Date.now(),
      });

      if (options?.sync) store.dispatch(updateReduxContact(newDoc));
    } catch (e) {
      logger.debug("LocalRxDb UpdateContact", e);
    }
  }

  async updateContacts(newDocs: Contact[]): Promise<void> {
    try {
      const databaseContacts = newDocs.map((contact) => this._getStorableContact(contact));

      await (
        await this.contacts
      )?.bulkUpsert(
        databaseContacts.map((doc) => ({
          ...doc,
          accountIdentifier: extractValueFromArray(doc.accountIdentifier),
          accounts: doc.accounts,
          deleted: false,
          updatedAt: Date.now(),
        })),
      );
      store.dispatch(setReduxContacts(newDocs));
    } catch (e) {
      logger.debug("LocalRxDb UpdateContacts", e);
    }
  }

  async deleteContact(principal: string, options?: DatabaseOptions): Promise<void> {
    try {
      const document = await (await this.contacts)?.findOne(principal).exec();
      await document?.remove();
      if (options?.sync) store.dispatch(deleteReduxContact(principal));
    } catch (e) {
      logger.debug("LocalRxDb DeleteContact", e);
    }
  }

  private _getStorableContact(contact: Contact): Contact {
    return {
      ...contact,
      accounts: contact.accounts.map((account) => {
        // eslint-disable-next-line
        const { allowance, ...rest } = account;
        return { ...rest };
      }),
    };
  }

  async getAllowance(id: string): Promise<TAllowance | null> {
    try {
      const document = await (await this.allowances)?.findOne(id).exec();
      return (document && this._mapAllowanceDoc(document)) || null;
    } catch (e) {
      logger.debug("LocalRxDb GetAllowance", e);
      return null;
    }
  }

  private async _allowanceStateSync(newAllowances?: TAllowance[]): Promise<void> {
    const documents = await (await this.allowances)?.find().exec();
    const result = (documents && documents.map(this._mapAllowanceDoc)) || [];
    const allowances = newAllowances || result || [];
    store.dispatch(setReduxAllowances(allowances));
  }

  async getAllowances(): Promise<TAllowance[]> {
    try {
      const documents = await (await this.allowances)?.find().exec();
      return (documents && documents.map(this._mapAllowanceDoc)) || [];
    } catch (e) {
      logger.debug("LocalRxDb GetAllowances", e);
      return [];
    }
  }

  async addAllowance(allowance: TAllowance, options?: DatabaseOptions): Promise<void> {
    const databaseAllowance = this._getStorableAllowance(allowance);

    try {
      await (
        await this.allowances
      )?.insert({
        ...databaseAllowance,
        asset: {
          ...databaseAllowance.asset,
          logo: extractValueFromArray(databaseAllowance.asset?.logo),
        },
        deleted: false,
        updatedAt: Date.now(),
      });

      if (options?.sync) store.dispatch(addReduxAllowance(allowance));
    } catch (e) {
      logger.debug("LocalRxDb AddAllowance", e);
    }
  }

  async updateAllowance(id: string, newDoc: TAllowance, options?: DatabaseOptions): Promise<void> {
    try {
      const databaseAllowance = this._getStorableAllowance(newDoc);
      const document = await (await this.allowances)?.findOne(id).exec();

      document?.patch({
        ...databaseAllowance,
        asset: {
          ...databaseAllowance.asset,
          logo: extractValueFromArray(databaseAllowance.asset?.logo),
        },
        deleted: false,
        updatedAt: Date.now(),
      });

      if (options?.sync) store.dispatch(updateReduxAllowance(newDoc));
    } catch (e) {
      logger.debug("LocalRxDb UpdateAllowance", e);
    }
  }

  async updateAllowances(newDocs: TAllowance[], options?: DatabaseOptions): Promise<void> {
    try {
      const databaseAllowances = newDocs.map((allowance) => this._getStorableAllowance(allowance));

      await (
        await this.allowances
      )?.bulkUpsert(
        databaseAllowances.map((doc) => ({
          ...doc,
          asset: {
            ...doc.asset,
            logo: extractValueFromArray(doc.asset?.logo),
          },
          deleted: false,
          updatedAt: Date.now(),
        })),
      );

      if (options?.sync) store.dispatch(setReduxAllowances(newDocs));
    } catch (e) {
      logger.debug("LocalRxDb UpdateAllowances", e);
    }
  }

  async deleteAllowance(id: string, options?: DatabaseOptions): Promise<void> {
    try {
      const document = await (await this.allowances)?.findOne(id).exec();
      await document?.remove();

      if (options?.sync) store.dispatch(deleteReduxAllowance(id));
    } catch (e) {
      logger.debug("LocalRxDb DeleteAllowance", e);
    }
  }

  async getServices(): Promise<ServiceData[]> {
    try {
      const documents = await (await this.services)?.find().exec();
      return (documents && documents.map(this._mapserviceDoc)) || [];
    } catch (e) {
      logger.debug("LocalRxDb Getservices", e);
      return [];
    }
  }

  private async _serviceStateSync(newServices?: ServiceData[]): Promise<void> {
    const documents = await (await this.services)?.find().exec();
    const result = (documents && documents.map(this._mapserviceDoc)) || [];
    const srvcs = newServices || result || [];
    store.dispatch(setServicesData(srvcs));
    if (srvcs.length === 0) store.dispatch(setServicesRedux([]));
  }

  async setServices(services: ServiceData[]): Promise<void> {
    try {
      await (
        await this.services
      )?.bulkUpsert(
        services.map((a) => ({
          ...a,
          deleted: false,
          updatedAt: Date.now(),
        })),
      );
    } catch (e) {
      logger.debug("LocalRxDb setServices:", e);
    }
  }

  async deleteService(principal: string): Promise<void> {
    try {
      const document = await (await this.services)?.findOne(principal).exec();
      await document?.remove();
    } catch (e) {
      logger.debug("LocalRxDb DeleteContact", e);
    }
  }

  private _getStorableAllowance(allowance: TAllowance): Pick<TAllowance, "id" | "asset" | "subAccountId" | "spender"> {
    // eslint-disable-next-line
    const { amount, expiration, ...rest } = allowance;
    return { ...rest };
  }

  private _mapContactDoc(doc: RxDocument<ContactRxdbDocument>): Contact {
    return {
      name: doc.name,
      principal: doc.principal,
      accountIdentifier: doc.accountIdentifier,
      accounts: doc.accounts.map((a) => ({
        name: a.name,
        subaccount: a.subaccount,
        subaccountId: a.subaccountId,
        tokenSymbol: a.tokenSymbol,
      })),
    };
  }

  private _mapAssetDoc(doc: RxDocument<AssetRxdbDocument>): Asset {
    return {
      name: doc.name,
      sortIndex: doc.sortIndex,
      address: doc.address,
      logo: doc.logo,
      decimal: doc.decimal,
      symbol: doc.symbol,
      index: doc.index,
      subAccounts: doc.subAccounts.map((sa) => ({
        numb: sa.sub_account_id,
        name: sa.name,
        amount: sa.amount,
        currency_amount: sa.currency_amount,
        address: sa.address,
        decimal: sa.decimal,
        sub_account_id: sa.sub_account_id,
        symbol: sa.symbol,
        transaction_fee: sa.transaction_fee,
      })),
      tokenName: doc.tokenName,
      tokenSymbol: doc.tokenSymbol,
      shortDecimal: doc.shortDecimal,
      supportedStandards: doc.supportedStandards as typeof SupportedStandardEnum.options,
    };
  }

  private _mapAllowanceDoc(doc: RxDocument<AllowanceRxdbDocument>): TAllowance {
    return {
      id: doc.id,
      subAccountId: doc.subAccountId,
      spender: doc.spender,
      asset: {
        logo: doc.asset.logo,
        name: doc.asset.name,
        symbol: doc.asset.symbol,
        address: doc.asset.address,
        decimal: doc.asset.decimal,
        tokenName: doc.asset.tokenName,
        tokenSymbol: doc.asset.tokenSymbol,
        supportedStandards: doc.asset.supportedStandards as typeof SupportedStandardEnum.options,
      },
    };
  }

  private _mapserviceDoc(doc: RxDocument<ServiceRxdbDocument>): ServiceData {
    return {
      name: doc.name,
      principal: doc.principal,
      assets: doc.assets.map((a) => ({
        principal: a.principal,
        logo: a.logo,
        tokenSymbol: a.tokenSymbol,
        tokenName: a.tokenName,
        shortDecimal: a.shortDecimal,
        decimal: a.decimal,
      })),
    };
  }

  private _invalidateDb(): void {
    this._assets = null!;
    this._contacts = null!;
    this._allowances = null!;
    this._services = null!;
    this._orders = null!;
    this._paymentVerifications = null!;
    this._kycDetails = null!;
  }

  // Order Methods
  async createOrder(order: Order): Promise<Order> {
    try {
      const result = await (await this.orders)?.insert(order);
      return result?.toJSON() || order;
    } catch (error) {
      logger.debug("LocalRxDb CreateOrder:", error);
      throw error;
    }
  }

  async getOrder(id: string): Promise<Order | null> {
    try {
      const result = await (await this.orders)?.findOne(id).exec();
      return result?.toJSON() || null;
    } catch (error) {
      logger.debug("LocalRxDb GetOrder:", error);
      return null;
    }
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    try {
      const result = await (await this.orders)?.findOne(id).exec();
      if (!result) return null;
      
      const updated = await result.patch(updates);
      return updated.toJSON();
    } catch (error) {
      logger.debug("LocalRxDb UpdateOrder:", error);
      return null;
    }
  }

  async getOrdersByStatus(status: Order['status']): Promise<Order[]> {
    try {
      const results = await (await this.orders)?.find({
        selector: { status }
      }).exec();
      return results?.map(doc => doc.toJSON()) || [];
    } catch (error) {
      logger.debug("LocalRxDb GetOrdersByStatus:", error);
      return [];
    }
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    try {
      const results = await (await this.orders)?.find({
        selector: { sellerId: userId }
      }).exec();
      return results?.map(doc => doc.toJSON()) || [];
    } catch (error) {
      logger.debug("LocalRxDb GetOrdersByUser:", error);
      return [];
    }
  }

  // Payment Verification Methods
  async createPaymentVerification(verification: PaymentVerification): Promise<PaymentVerification> {
    try {
      const result = await (await this.paymentVerifications)?.insert(verification);
      return result?.toJSON() || verification;
    } catch (error) {
      logger.debug("LocalRxDb CreatePaymentVerification:", error);
      throw error;
    }
  }

  async getPaymentVerification(orderId: string): Promise<PaymentVerification | null> {
    try {
      const result = await (await this.paymentVerifications)?.findOne(orderId).exec();
      return result?.toJSON() || null;
    } catch (error) {
      logger.debug("LocalRxDb GetPaymentVerification:", error);
      return null;
    }
  }

  async updatePaymentVerification(orderId: string, updates: Partial<PaymentVerification>): Promise<PaymentVerification | null> {
    try {
      const result = await (await this.paymentVerifications)?.findOne(orderId).exec();
      if (!result) return null;
      
      const updated = await result.patch(updates);
      return updated.toJSON();
    } catch (error) {
      logger.debug("LocalRxDb UpdatePaymentVerification:", error);
      return null;
    }
  }

  async getPaymentVerificationsByOrder(orderId: string): Promise<PaymentVerification[]> {
    try {
      const results = await (await this.paymentVerifications)?.find({
        selector: { orderId }
      }).exec();
      return results?.map(doc => doc.toJSON()) || [];
    } catch (error) {
      logger.debug("LocalRxDb GetPaymentVerificationsByOrder:", error);
      return [];
    }
  }

  async addKYCDetails(details: KYCDetails): Promise<void> {
    try {
      await (await this.kycDetails)?.insert(details);
    } catch (e) {
      logger.debug("LocalRxDb AddKYCDetails:", e);
    }
  }
}