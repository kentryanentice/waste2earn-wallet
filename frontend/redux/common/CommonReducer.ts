import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export enum Currency {
  USD = "USD",
  PHP = "PHP"
}

interface CommonState {
  isAppDataFreshing: boolean;
  selectedCurrency: Currency;
}

const initialState: CommonState = {
  isAppDataFreshing: false,
  selectedCurrency: Currency.USD,
};

const commonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {
    setAppDataRefreshing(state, action: PayloadAction<boolean>) {
      state.isAppDataFreshing = action.payload;
    },
    setCurrency(state, action: PayloadAction<Currency>) {
      state.selectedCurrency = action.payload;
    },
  },
});

export const { setAppDataRefreshing, setCurrency } = commonSlice.actions;

export default commonSlice.reducer;
