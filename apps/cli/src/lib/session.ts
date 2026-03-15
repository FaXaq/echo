import { auth } from "../adapters/auth";
import { cliConfig } from "../config/index";

let adminHeaders: Headers | null = null;

export const getAdminHeaders = async (): Promise<Headers> => {
  if (adminHeaders) return adminHeaders;

  const response = await auth.api.signInEmail({
    body: {
      email: cliConfig.admin.email,
      password: cliConfig.admin.password,
    },
    asResponse: true,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to authenticate as admin (${response.status}). ` +
        "Ensure CLI_ADMIN_EMAIL and CLI_ADMIN_PASSWORD are set to a valid admin account.",
    );
  }

  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error("No session cookie received from auth.");
  }

  adminHeaders = new Headers({ cookie: setCookie });
  return adminHeaders;
};
