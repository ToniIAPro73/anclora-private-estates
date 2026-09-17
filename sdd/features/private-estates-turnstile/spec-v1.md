# Private Estates Contact Turnstile — Spec v1

## Objective

Protect the Private Estates public commercial-lead form with Cloudflare Turnstile and enforce verification in the canonical Nexus intake service.

## Contract

- Client provider: `turnstile`.
- Public client variable: `VITE_TURNSTILE_SITE_KEY`.
- Dedicated action: `private_estates_contact`.
- Payload fields: `captcha_provider: "turnstile"`, `captcha_token`.
- Server verification owner: Nexus `CaptchaVerificationService` through `/api/public/intake/commercial-leads`.
- Server secret: `TURNSTILE_SECRET_KEY`; never exposed to the client.

## Behavior

- A configured production Turnstile widget is fail-closed: missing, expired, errored, or rejected tokens block submission.
- The Nexus commercial-lead endpoint verifies the token before persistence.
- Turnstile verification errors do not persist a lead.
- Local development may use an explicit test configuration only; no implicit production secret or database change is introduced.
- Legacy reCAPTCHA and ALTCHA paths are removed from Private Estates after migration tests prove no active use remains.

## Acceptance criteria

1. Widget renders with the dedicated action.
2. Submit is disabled until a token is available.
3. Expiry/error clears the token and permits recovery.
4. Payload contains only the Turnstile provider/token fields.
5. Nexus rejects missing/invalid Turnstile tokens before persistence.
6. Nexus accepts a verified Turnstile result and records verification metadata.
7. No secret or token is logged or bundled.
