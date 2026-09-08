# Email verification uses OTP codes, not links, for all sign-ups

ECH-101 needs the invite-acceptance flow to survive email verification without losing the invitation's URL context — link-based verification sends the user to a separate `/verify-email?token=` page, breaking out of `/accept-invitation`. Switching to better-auth's `email-otp` plugin (`overrideDefaultEmailVerification`) lets the user stay on-route and enter a code inline instead. This applies to all sign-ups, not just invited ones, rather than running two parallel verification mechanisms side by side — one code path, one email template, no branching on whether the account came from an invite. Codes rotate on resend (`resendStrategy: "rotate"`) and the email carries a code only, no link.

## Considered Options

Keeping the link-based flow for organic (non-invite) sign-ups and adding OTP only for invited ones was rejected — two verification mechanisms is double the code, translations, and email templates to maintain, for a UX difference that isn't worse for non-invited users either.
