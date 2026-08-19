import * as React from "react";

// esbuild bundles this repo's real `@lingui/react/macro` import without running
// the SWC/Babel macro transform the app's real build applies, so the macro's
// own guard throws "executed outside the context of compilation" at render
// time. This stub renders the untransformed source text directly — visually
// identical to the transformed output under the default "en" locale, where
// Lingui falls back to the message's source text. Redirected here via
// tsconfigPathsPlugin (see .design-sync/tsconfig.build.json).

export function Trans({ children }: { children?: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children);
}

function t(strings: TemplateStringsArray, ...values: unknown[]) {
  return strings.reduce((acc, s, i) => acc + s + (i < values.length ? String(values[i]) : ""), "");
}

export function useLingui() {
  return { t, i18n: { locale: "en", _: (id: string) => id } };
}
