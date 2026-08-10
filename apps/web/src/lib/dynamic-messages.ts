import { msg } from "@lingui/core/macro";
import type { MessageDescriptor } from "@lingui/core";

/**
 * Messages looked up by a runtime value rather than referenced literally
 * (Zod validation errors, server error fallbacks, breadcrumb labels, role
 * names). Lingui's extractor can't see these call sites, so they're listed
 * here once and translated via `translateDynamic`.
 */
export const DYNAMIC_MESSAGES: Record<string, MessageDescriptor> = {
  "Full name is required": msg`Full name is required`,
  "Username must be at least 3 characters": msg`Username must be at least 3 characters`,
  "Letters, numbers, _ and - only": msg`Letters, numbers, _ and - only`,
  "Invalid email address": msg`Invalid email address`,
  "At least 12 characters": msg`At least 12 characters`,
  "Maximum 72 characters": msg`Maximum 72 characters`,
  "At least one uppercase letter": msg`At least one uppercase letter`,
  "At least one lowercase letter": msg`At least one lowercase letter`,
  "At least one number": msg`At least one number`,
  "At least one special character": msg`At least one special character`,
  "Please confirm your password": msg`Please confirm your password`,
  "Passwords do not match": msg`Passwords do not match`,
  "Email or username is required": msg`Email or username is required`,
  "Password is required": msg`Password is required`,
  "Project name is required": msg`Project name is required`,
  "Organization name is required": msg`Organization name is required`,
  "Title is required": msg`Title is required`,
  "End date must be after start date": msg`End date must be after start date`,

  "Login failed": msg`Login failed`,
  "Sign up failed": msg`Sign up failed`,
  "Failed to send reset email": msg`Failed to send reset email`,
  "Check your email for a password reset link": msg`Check your email for a password reset link`,
  "Password reset failed": msg`Password reset failed`,
  "Failed to create organization": msg`Failed to create organization`,
  "Could not generate a unique organization slug": msg`Could not generate a unique organization slug`,
  "Upload failed": msg`Upload failed`,

  Calendar: msg`Calendar`,
  "Event details": msg`Event details`,
  Members: msg`Members`,
  "New project": msg`New project`,
  "Accept invitation": msg`Accept invitation`,
  "Reset password": msg`Reset password`,

  member: msg`Member`,
  admin: msg`Admin`,
  owner: msg`Owner`,
};

export function translateDynamic(
  _: (descriptor: MessageDescriptor) => string,
  text: string,
): string {
  const descriptor = DYNAMIC_MESSAGES[text];
  return descriptor ? _(descriptor) : text;
}
