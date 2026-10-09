export const isSupportedCurrency = (code: string) =>
  Intl.supportedValuesOf("currency").includes(code);

export const currencyExponent = (code: string) =>
  new Intl.NumberFormat("en", { style: "currency", currency: code }).resolvedOptions()
    .maximumFractionDigits ?? 2;
