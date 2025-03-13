import store from "@redux/Store";
import { Currency } from "@redux/common/CommonReducer";

// Fixed exchange rate for USD to PHP (1 USD = 56 PHP)
const USD_TO_PHP_RATE = 56;

export default function getTotalAmountInCurrency() {
  let amount = 0;

  store.getState().asset.list.assets.map((tk) => {
    const market = store.getState().asset.utilData.tokensMarket.find((tm) => tm.symbol === tk.tokenSymbol);
    let assetTotal = BigInt(0);
    tk.subAccounts.map((sa) => {
      assetTotal = assetTotal + BigInt(sa.amount);
    });
    amount = amount + (market ? (Number(assetTotal.toString()) * market.price) / Math.pow(10, Number(tk.decimal)) : 0);
  });

  const selectedCurrency = store.getState().common.selectedCurrency;
  if (selectedCurrency === Currency.PHP) {
    amount = amount * USD_TO_PHP_RATE;
  }

  return Math.round(amount * 100) / 100;
}
