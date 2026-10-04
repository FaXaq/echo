import { currencyExponent } from "@echo/modules/expense/domain";

export function formatMoney(amountMinor: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    amountMinor / 10 ** currencyExponent(currency),
  );
}
