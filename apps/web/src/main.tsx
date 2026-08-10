import "./i18n";
import "./lib/dayjs";
import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { I18nProvider } from "@lingui/react";
import { i18n } from "@lingui/core";
import { authClient } from "./lib/auth";
import { queryClient } from "./lib/query-client";
import { router } from "./router";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Cannot find root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <I18nProvider i18n={i18n}>
      <RouterProvider router={router} context={{ auth: authClient, queryClient }} />
    </I18nProvider>
  </StrictMode>,
);
