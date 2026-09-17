import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTranslation } from 'react-i18next';
import { MapPin, Phone, Mail, ArrowRight, Calendar, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { useTurnstile } from '../hooks/useTurnstile';

gsap.registerPlugin(ScrollTrigger);

const contactInfo = [
  {
    icon: Mail,
    labelKey: 'contact.email',
    value: 'hello@ancloraprivateestates.com',
    href: 'mailto:hello@ancloraprivateestates.com',
  },
  {
    icon: Phone,
    labelKey: 'contact.whatsapp',
    value: '+34 600 000 000',
    href: 'tel:+34600000000',
  },
  {
    icon: MapPin,
    labelKey: 'contact.office',
    value: 'Palma de Mallorca',
    href: '#',
  },
];

export function ContactSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const contactCardRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '';
  const nexusPublicLeadUrl =
    import.meta.env.VITE_ANCLORA_NEXUS_PUBLIC_LEAD_URL ??
    import.meta.env.VITE_NEXUS_PUBLIC_LEAD_URL ??
    '/api/public/intake/commercial-leads';
  const captchaProvider = 'turnstile' as const;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    interest: '',
    message: '',
    newsletter: false,
    privacyAccepted: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');
  const {
    captchaToken,
    captchaStatus,
    captchaContainerRef,
    resetCaptcha,
  } = useTurnstile(turnstileSiteKey, 'private_estates_contact');

  useEffect(() => {
    const section = sectionRef.current;
    const contactCard = contactCardRef.current;
    const details = detailsRef.current;
    const form = formRef.current;

    if (!section || !contactCard || !details || !form) return;

    const ctx = gsap.context(() => {
      // Contact card reveal
      gsap.fromTo(
        contactCard,
        { x: '-8vw', opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: contactCard,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Details panel reveal
      gsap.fromTo(
        details,
        { x: '8vw', opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: details,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        form,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: form,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, [t]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.privacyAccepted) {
      setSubmitStatus('error');
      setSubmitError(t('contact.form.privacyRequired'));
      return;
    }

    if (!turnstileSiteKey || !captchaToken) {
      setSubmitStatus('error');
      setSubmitError(t('contact.form.captchaRequired'));
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitError('');

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const payload = {
        // Anclora Intake Contract v1
        schema_version: 'anclora-intake-v1',
        intake_domain: 'commercial_lead',
        request_type: 'general_commercial_inquiry',
        source: 'private_estates_web',
        target_product: null,
        service_interest: 'other',
        idempotency_key: crypto.randomUUID(),
        routing_target_domain: 'leads',

        // Canonical Intake Contract fields
        applicant: {
          full_name: fullName || formData.firstName || 'Web Contact',
          email: formData.email,
          phone: formData.phone || undefined,
        },
        contact_email: formData.email,
        email: formData.email,
        name: fullName || formData.firstName || 'Web Contact',
        phone: formData.phone || undefined,

        context: {
          property_interest: formData.interest || undefined,
          message: formData.message || undefined,
          newsletter_opt_in: formData.newsletter,
          source_url: window.location.href,
          source_referrer: document.referrer || undefined,
        },
        consent: {
          privacy_accepted: formData.privacyAccepted,
          gdpr_consent: formData.privacyAccepted,
        },

        source_system: 'cta_web',
        source_channel: 'website',
        source_detail: 'private-estates-contact-form',
        source_url: window.location.href,
        source_referrer: document.referrer || undefined,
        captcha_provider: captchaProvider,
        captcha_token: captchaToken,
      };

      const response = await fetch(nexusPublicLeadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.detail || t('contact.form.error'));
      }

      setSubmitStatus('success');
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        interest: '',
        message: '',
        newsletter: false,
        privacyAccepted: false,
      });
      resetCaptcha();
    } catch (error) {
      setSubmitStatus('error');
      setSubmitError(error instanceof Error ? error.message : t('contact.form.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="section-flowing bg-anclora-cream dark:bg-anclora-teal py-24 lg:py-32"
    >
      <div className="w-full px-6 lg:pl-12 lg:pr-[136px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Contact Card */}
          <div className="lg:col-span-7">
            <div
              ref={contactCardRef}
              className="card-premium overflow-hidden h-[64vh] relative"
            >
              <img
                src="/images/contact-office.jpg"
                alt="Anclora Office"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-anclora-teal dark:from-anclora-teal via-anclora-teal/60 dark:via-anclora-teal/60 to-transparent" />
              
              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                <p className="text-eyebrow mb-4">{t('nav.contact')}</p>
                <h2 className="font-display text-4xl lg:text-5xl font-bold text-anclora-cream leading-tight mb-4">
                  {t('contact.title').split('.')[0]}.<br />{t('contact.title').split('.')[1]}.
                </h2>
                <p className="text-anclora-text-muted leading-relaxed max-w-lg mb-6">
                  {t('contact.description')}
                </p>
                <button className="btn-anclora-premium flex items-center gap-2 !min-w-[200px]">
                  <Calendar className="w-4 h-4" />
                  {t('contact.cta')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Details Panel */}
          <div className="lg:col-span-5">
            <div
              ref={detailsRef}
              className="h-full flex flex-col justify-center"
            >
              <div className="p-8 bg-anclora-teal-bg dark:bg-anclora-teal-bg/70 rounded-2xl border border-anclora-navy/10 dark:border-white/10">
                <h3 className="font-display text-2xl font-semibold text-anclora-cream mb-8">
                  {t('footer.contact')}
                </h3>

                <div className="space-y-6">
                  {contactInfo.map((item) => (
                    <a
                      key={item.labelKey}
                      href={item.href}
                      className="flex items-center gap-4 group min-w-0"
                    >
                      <div className="w-12 h-12 rounded-full bg-anclora-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-anclora-gold/20 transition-colors">
                        <item.icon className="w-5 h-5 text-anclora-gold" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-anclora-text-muted mb-0.5">
                          {t(item.labelKey)}
                        </p>
                        <p className="text-anclora-cream font-medium group-hover:text-anclora-gold transition-colors break-all sm:break-words">
                          {item.value}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>

                {/* Office Hours */}
                <div className="mt-8 pt-8 border-t border-anclora-navy/10 dark:border-white/10">
                  <p className="text-sm text-anclora-text-muted mb-2">
                    {t('contact.hours')}
                  </p>
                  <p className="text-anclora-cream">
                    {t('contact.weekdays')}
                  </p>
                  <p className="text-anclora-cream">
                    {t('contact.saturday')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div ref={formRef} className="mt-10 lg:mt-14">
          <div className="card-premium p-6 lg:p-8">
            <div className="mb-6">
              <p className="text-eyebrow mb-3">{t('contact.form.eyebrow')}</p>
              <h3 className="font-display text-3xl lg:text-4xl font-semibold text-anclora-cream mb-3">
                {t('contact.form.title')}
              </h3>
              <p className="text-anclora-text-muted leading-relaxed">
                {t('contact.form.description')}
              </p>
            </div>

            {submitStatus === 'success' ? (
              <div className="rounded-xl border border-anclora-gold/30 bg-anclora-gold/10 p-5 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-anclora-gold mt-0.5" />
                <p className="text-anclora-cream">{t('contact.form.success')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
                <div>
                  <label htmlFor="firstName" className="block text-sm text-anclora-text-muted mb-1.5">
                    {t('contact.form.firstName')}
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    className="input-anclora"
                    value={formData.firstName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                    placeholder={t('contact.form.placeholderFirstName')}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm text-anclora-text-muted mb-1.5">
                    {t('contact.form.lastName')}
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    className="input-anclora"
                    value={formData.lastName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                    placeholder={t('contact.form.placeholderLastName')}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm text-anclora-text-muted mb-1.5">
                    {t('contact.form.phone')}
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className="input-anclora"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder={t('contact.form.placeholderPhone')}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm text-anclora-text-muted mb-1.5">
                    {t('contact.form.email')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="input-anclora"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder={t('contact.form.placeholderEmail')}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="interest" className="block text-sm text-anclora-text-muted mb-1.5">
                    {t('contact.form.interest')}
                  </label>
                  <input
                    id="interest"
                    type="text"
                    className="input-anclora"
                    value={formData.interest}
                    onChange={(e) => setFormData((prev) => ({ ...prev, interest: e.target.value }))}
                    placeholder={t('contact.form.placeholderInterest')}
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm text-anclora-text-muted mb-1.5">
                    {t('contact.form.message')}
                  </label>
                  <textarea
                    id="message"
                    className="input-anclora h-28 resize-none"
                    value={formData.message}
                    onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                    placeholder={t('contact.form.placeholderMessage')}
                  />
                </div>

                <div className="lg:col-span-2 space-y-2.5 mt-1">
                  <div className="captcha-shell">
                    <p className="text-sm text-anclora-text-muted mb-3">{t('contact.form.captchaLabel')}</p>
                    {!turnstileSiteKey ? (
                      <p className="text-sm text-red-200">{t('contact.form.captchaNotConfigured')}</p>
                    ) : (
                      <>
                        <div ref={captchaContainerRef} className="captcha-widget-frame" />
                        {!captchaToken && (
                          <p className="text-xs text-anclora-text-muted mt-3">
                            {captchaStatus === 'loading'
                              ? t('contact.form.captchaLoading')
                              : t('contact.form.captchaVerifyPrompt')}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <label className="flex items-start gap-2.5 text-sm text-anclora-text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-[var(--anclora-gold)]"
                      checked={formData.newsletter}
                      onChange={(e) => setFormData((prev) => ({ ...prev, newsletter: e.target.checked }))}
                    />
                    <span>{t('contact.form.newsletter')}</span>
                  </label>

                  <label className="flex items-start gap-2.5 text-sm text-anclora-text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-[var(--anclora-gold)]"
                      checked={formData.privacyAccepted}
                      onChange={(e) => setFormData((prev) => ({ ...prev, privacyAccepted: e.target.checked }))}
                      required
                    />
                    <span>{t('contact.form.privacy')}</span>
                  </label>
                </div>

                {submitStatus === 'error' && (
                  <div className="lg:col-span-2 rounded-xl border border-red-400/25 bg-red-500/10 p-4 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-300 mt-0.5" />
                    <p className="text-sm text-red-100">{submitError || t('contact.form.error')}</p>
                  </div>
                )}

                <div className="lg:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !formData.privacyAccepted ||
                      !turnstileSiteKey ||
                      !captchaToken
                    }
                    className="btn-anclora-premium inline-flex items-center gap-2 !min-w-[220px] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? t('contact.form.sending') : t('contact.form.submit')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
