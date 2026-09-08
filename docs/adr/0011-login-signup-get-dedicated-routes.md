# Login/signup get dedicated routes instead of `Landing`'s internal view state

`Landing` (`apps/web/src/routes/-landing.tsx`) held login/signup/forgot-password as a `useState` view toggle with no URL change, mounted both at `/` and embedded inside `/accept-invitation`. This broke back-button behavior and deep-linking, and — critically for ECH-101 — meant the invitation id carried in `/accept-invitation`'s URL had nowhere to go once the user needed to sign up and verify their email elsewhere. Replaced with real `/login` and `/signup` routes accepting a `redirect` search param; `/accept-invitation` redirects into them when there's no session and they redirect back once there is one. `/verify-email` (previously token-based) is repurposed the same way for OTP code entry.

## Considered Options

Scoping the fix to a parallel route tree under `/accept-invitation/*` was rejected — it would mean building a second copy of login/signup navigation for one entry point instead of fixing the one `Landing` component every entry point shares.
