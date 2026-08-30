import { makeClientAuth } from "@echo/auth/client";
import { apiUrl } from "./api-url";

export const authClient = makeClientAuth({ baseURL: apiUrl || undefined });
