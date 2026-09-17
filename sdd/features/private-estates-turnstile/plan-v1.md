# Private Estates Contact Turnstile — Plan v1

1. Add a small typed Turnstile hook based on the established Anclora implementation.
2. Replace the Private Estates ContactSection reCAPTCHA/ALTCHA branches with Turnstile.
3. Extend Nexus commercial-lead handling to invoke the existing server verifier before persistence.
4. Add frontend contract tests and Nexus fail-closed tests.
5. Update `.env.example` and non-secret documentation.
6. Run repository lint/tests/typecheck/build where permitted by repository rules.
7. Commit and push `development`; do not promote or deploy automatically.
