import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const rates = {
  USD: 1,
  BDT: 110,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.53,
  INR: 83.5,
  SGD: 1.35,
  AED: 3.67,
  SAR: 3.75,
};

export type CurrencyCode = keyof typeof rates;

interface CurrencyState {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatPrice: (priceInUSD: number) => string;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'USD',
      setCurrency: (currency: CurrencyCode) => set({ currency }),
      formatPrice: (priceInUSD: number) => {
        const { currency } = get();
        const rate = rates[currency] || 1;
        const converted = priceInUSD * rate;
        
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(converted);
      }
    }),
    {
      name: 'snapcase-currency',
    }
  )
);
