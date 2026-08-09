import { render as rtlRender, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { I18nProvider } from "@lingui/react";
import { i18n } from "@lingui/core";

export * from "@testing-library/react";

function Wrapper({ children }: { children: ReactNode }) {
  return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
}

export function render(ui: ReactElement, options?: RenderOptions) {
  return rtlRender(ui, { wrapper: Wrapper, ...options });
}
