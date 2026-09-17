import { useEffect, useRef, useState } from 'react';

type TurnstileStatus = 'loading' | 'ready' | 'failed';

type TurnstileApi = {
  render: (container: HTMLElement, options: {
    sitekey: string;
    action: string;
    theme: 'dark';
    size: 'flexible';
    callback: (token: string) => void;
    'expired-callback': () => void;
    'error-callback': () => void;
  }) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function useTurnstile(siteKey: string, action: string) {
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaStatus, setCaptchaStatus] = useState<TurnstileStatus>('loading');
  const captchaContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey) {
      setCaptchaStatus('failed');
      return;
    }

    let mounted = true;
    let attempts = 0;
    const render = () => {
      if (!mounted || widgetIdRef.current || !captchaContainerRef.current) return;
      if (window.turnstile?.render) {
        try {
          widgetIdRef.current = window.turnstile.render(captchaContainerRef.current, {
            sitekey: siteKey,
            action,
            theme: 'dark',
            size: 'flexible',
            callback: (token) => { if (mounted) { setCaptchaToken(token); setCaptchaStatus('ready'); } },
            'expired-callback': () => { if (mounted) { setCaptchaToken(''); setCaptchaStatus('failed'); } },
            'error-callback': () => { if (mounted) { setCaptchaToken(''); setCaptchaStatus('failed'); } },
          });
          return;
        } catch {
          setCaptchaStatus('failed');
          return;
        }
      }
      if (attempts++ < 30) window.setTimeout(render, 200);
      else if (mounted) setCaptchaStatus('failed');
    };

    setCaptchaStatus('loading');
    if (!document.querySelector('script[src*="turnstile/v0/api.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    render();

    return () => {
      mounted = false;
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [action, siteKey]);

  const resetCaptcha = () => {
    setCaptchaToken('');
    setCaptchaStatus('loading');
    if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current);
  };

  return { captchaToken, captchaStatus, captchaContainerRef, resetCaptcha };
}
