import "./i18n";
import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { authClient } from "./lib/auth";
import { router } from "./router";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Cannot find root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} context={{ auth: authClient }} />
  </StrictMode>,
);
