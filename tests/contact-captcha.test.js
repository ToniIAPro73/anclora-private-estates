import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const contactSource = fs.readFileSync('src/sections/ContactSection.tsx', 'utf8');
const hookSource = fs.readFileSync('src/hooks/useTurnstile.ts', 'utf8');

test('Private Estates uses the canonical Turnstile provider and action', () => {
  assert.match(contactSource, /useTurnstile\(turnstileSiteKey, 'private_estates_contact'\)/);
  assert.match(contactSource, /VITE_TURNSTILE_SITE_KEY/);
  assert.match(contactSource, /captcha_provider: captchaProvider/);
  assert.match(contactSource, /captcha_token: captchaToken/);
  assert.doesNotMatch(contactSource, /grecaptcha|VITE_RECAPTCHA|altcha_payload|VITE_ALTCHA/);
});

test('Turnstile hook loads explicit rendering and clears expired/error tokens', () => {
  assert.match(hookSource, /turnstile\/v0\/api\.js\?render=explicit/);
  assert.match(hookSource, /action,/);
  assert.match(hookSource, /'expired-callback'/);
  assert.match(hookSource, /'error-callback'/);
  assert.match(hookSource, /setCaptchaToken\(''\)/);
});

test('Private Estates submit is fail-closed without a Turnstile token', () => {
  assert.match(contactSource, /!turnstileSiteKey \|\|\s*!captchaToken/);
  assert.match(contactSource, /disabled=\{/);
});
