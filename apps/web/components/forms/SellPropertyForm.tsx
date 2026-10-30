'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Building2,
  MapPin,
  FileText,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  MessageCircle,
  RotateCcw,
} from 'lucide-react';
import {
  CountryCode,
  CurrencyCode,
  PropertyType,
  SubmissionCreateSchema,
} from '@wild-hills/contracts';
import { COUNTRY_CODES, CURRENCY_CODES } from '@/lib/countries';
import { createSubmission } from '@/lib/data';
import { cn } from '@/lib/utils';

export interface SellPropertyFormProps {
  defaultCountry: CountryCode;
  defaultCurrency?: CurrencyCode;
  className?: string;
}

export function SellPropertyForm({
  defaultCountry,
  defaultCurrency = 'AED',
  className,
}: SellPropertyFormProps) {
  const t = useTranslations('sell');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submissionResult, setSubmissionResult] = useState<{
    submissionId: string;
  } | null>(null);

  // Form field state
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment');
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [sizeSqm, setSizeSqm] = useState<string>('');
  const [expectedPrice, setExpectedPrice] = useState<string>('');
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);

  const [countryCode, setCountryCode] = useState<CountryCode>(defaultCountry);
  const [city, setCity] = useState<string>('');
  const [area, setArea] = useState<string>('');

  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [sellerName, setSellerName] = useState<string>('');
  const [sellerEmail, setSellerEmail] = useState<string>('');
  const [sellerPhone, setSellerPhone] = useState<string>('');
  const [consentGiven, setConsentGiven] = useState<boolean>(false);

  // Step validation helpers
  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      const parsedSize = parseFloat(sizeSqm);
      if (!sizeSqm || isNaN(parsedSize) || parsedSize <= 0) {
        newErrors.sizeSqm = 'Please enter a valid property size in m² (e.g. 120)';
      }
      const parsedPrice = parseFloat(expectedPrice);
      if (!expectedPrice || isNaN(parsedPrice) || parsedPrice <= 0) {
        newErrors.expectedPrice = 'Please enter a valid expected asking price';
      }
    } else if (currentStep === 2) {
      if (!city.trim()) {
        newErrors.city = 'City name is required';
      }
    } else if (currentStep === 3) {
      if (description.length > 2000) {
        newErrors.description = 'Description cannot exceed 2000 characters';
      }
    } else if (currentStep === 4) {
      if (!sellerName.trim() || sellerName.trim().length < 2) {
        newErrors.sellerName = 'Full name must be at least 2 characters';
      }
      if (!sellerEmail.trim() || !sellerEmail.includes('@')) {
        newErrors.sellerEmail = 'A valid email address is required';
      }
      if (!sellerPhone.trim() || sellerPhone.trim().length < 7) {
        newErrors.sellerPhone = 'A valid international phone number is required';
      }
      if (!consentGiven) {
        newErrors.consentGiven = 'You must authorize Wild Hills to contact you';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => (Math.min(prev + 1, 4) as 1 | 2 | 3 | 4));
    }
  };

  const handlePrev = () => {
    setErrors({});
    setStep((prev) => (Math.max(prev - 1, 1) as 1 | 2 | 3 | 4));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const parsedSize = parseFloat(sizeSqm);
      const parsedPrice = parseFloat(expectedPrice);
      // Minor units conversion (price * 100)
      const expectedPriceMinor = Math.round(parsedPrice * 100);

      const payload = {
        sellerName: sellerName.trim(),
        sellerEmail: sellerEmail.trim(),
        sellerPhone: sellerPhone.trim(),
        countryCode,
        city: city.trim(),
        area: area.trim() ? area.trim() : undefined,
        propertyType,
        bedrooms: Math.max(0, bedrooms),
        bathrooms: Math.max(0, bathrooms),
        sizeSqm: parsedSize,
        expectedPriceMinor,
        currency,
        description: description.trim() ? description.trim() : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
        images: [],
        consentGiven: true as const,
      };

      // Strict client-side validation against contract schema
      const validated = SubmissionCreateSchema.parse(payload);
      const res = await createSubmission(validated);

      if (res.success) {
        setSubmissionResult({ submissionId: res.submissionId });
      } else {
        setErrors({ form: res.message || 'Submission failed. Please try again.' });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrors({ form: err.message });
      } else {
        setErrors({ form: 'An unexpected error occurred during submission.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmissionResult(null);
    setStep(1);
    setSizeSqm('');
    setExpectedPrice('');
    setCity('');
    setArea('');
    setDescription('');
    setNotes('');
    setSellerName('');
    setSellerEmail('');
    setSellerPhone('');
    setConsentGiven(false);
    setErrors({});
  };

  // ----------------------------------------------------
  // Success Confirmation State
  // ----------------------------------------------------
  if (submissionResult) {
    return (
      <div className={cn('bg-card rounded-3xl border border-line p-8 sm:p-12 shadow-sm text-start', className)}>
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          {t('success.title')}
        </h2>
        <p className="mt-2 text-sm sm:text-base text-muted">
          {t('success.subtitle')}
        </p>

        {/* Reference Code Card */}
        <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-sand border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs uppercase tracking-wider text-muted font-medium">
              {t('success.refLabel')}
            </span>
            <p className="text-lg sm:text-xl font-mono font-bold text-navy">
              {submissionResult.submissionId}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Under Priority Review</span>
          </span>
        </div>

        {/* Next Steps Timeline */}
        <div className="mt-8 pt-8 border-t border-line">
          <h3 className="font-serif text-lg font-bold text-navy mb-4">
            {t('success.timelineTitle')}
          </h3>
          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-navy text-sand text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <p className="text-xs sm:text-sm text-muted">
                {t('success.timelineStep1')}
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-navy text-sand text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <p className="text-xs sm:text-sm text-muted">
                {t('success.timelineStep2')}
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-gold text-navy text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <p className="text-xs sm:text-sm text-muted">
                {t('success.timelineStep3')}
              </p>
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-line flex flex-col sm:flex-row items-center gap-4">
          <a
            href="https://wa.me/97140000000"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{t('success.whatsappButton')}</span>
          </a>

          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-line text-navy font-semibold text-sm hover:bg-sand transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('success.submitAnother')}</span>
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Multi-step Wizard Intake
  // ----------------------------------------------------
  return (
    <div className={cn('bg-card rounded-3xl border border-line p-6 sm:p-10 shadow-sm text-start', className)}>
      {/* Progress Stepper Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-muted mb-3">
          <span className="text-navy">
            Step {step} of 4: {t(`form.step${step}Title` as unknown as 'form.step1Title')}
          </span>
          <span>{Math.round((step / 4) * 100)}% Completed</span>
        </div>
        <div className="w-full h-2 rounded-full bg-sand overflow-hidden">
          <div
            className="h-full bg-gold transition-all duration-300 rounded-full"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {errors.form && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ================= STEP 1: Property Details ================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-serif text-xl font-bold text-navy">
                {t('form.step1Title')}
              </h3>
              <p className="text-xs sm:text-sm text-muted mt-1">
                {t('form.step1Subtitle')}
              </p>
            </div>

            {/* Property Type Radio Pills */}
            <div>
              <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                {t('form.propertyType')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {(['apartment', 'villa', 'townhouse', 'penthouse', 'duplex'] as PropertyType[]).map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPropertyType(type)}
                      className={cn(
                        'px-3 py-2.5 rounded-xl border text-xs font-semibold capitalize transition-all',
                        propertyType === type
                          ? 'bg-navy text-sand border-navy shadow-sm'
                          : 'bg-sand/60 text-navy/80 border-line hover:border-gold/50'
                      )}
                    >
                      {type}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Beds & Baths */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  {t('form.bedrooms')}
                </label>
                <div className="flex items-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBedrooms(b)}
                      className={cn(
                        'flex-1 py-2 rounded-xl border text-xs font-bold transition-all',
                        bedrooms === b
                          ? 'bg-navy text-sand border-navy'
                          : 'bg-sand/60 text-navy border-line hover:border-gold'
                      )}
                    >
                      {b === 0 ? 'Studio' : b === 5 ? '5+' : b}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  {t('form.bathrooms')}
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBathrooms(b)}
                      className={cn(
                        'flex-1 py-2 rounded-xl border text-xs font-bold transition-all',
                        bathrooms === b
                          ? 'bg-navy text-sand border-navy'
                          : 'bg-sand/60 text-navy border-line hover:border-gold'
                      )}
                    >
                      {b === 5 ? '5+' : b}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Size & Expected Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  {t('form.size')}
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={sizeSqm}
                  onChange={(e) => setSizeSqm(e.target.value)}
                  placeholder="e.g. 145"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl bg-sand/60 border text-navy text-sm focus:outline-none focus:ring-1 focus:ring-gold',
                    errors.sizeSqm ? 'border-red-500' : 'border-line'
                  )}
                />
                {errors.sizeSqm && (
                  <p className="mt-1 text-xs text-red-600">{errors.sizeSqm}</p>
                )}
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  {t('form.expectedPrice')}
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={expectedPrice}
                  onChange={(e) => setExpectedPrice(e.target.value)}
                  placeholder="e.g. 2400000"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl bg-sand/60 border text-navy text-sm focus:outline-none focus:ring-1 focus:ring-gold',
                    errors.expectedPrice ? 'border-red-500' : 'border-line'
                  )}
                />
                {errors.expectedPrice && (
                  <p className="mt-1 text-xs text-red-600">{errors.expectedPrice}</p>
                )}
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  {t('form.currency')}
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full px-4 py-2.5 rounded-xl bg-sand/60 border border-line text-navy text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  {CURRENCY_CODES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: Location & Address ================= */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-serif text-xl font-bold text-navy">
                {t('form.step2Title')}
              </h3>
              <p className="text-xs sm:text-sm text-muted mt-1">
                {t('form.step2Subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  {t('form.country')}
                </label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value as CountryCode)}
                  className="w-full px-4 py-2.5 rounded-xl bg-sand/60 border border-line text-navy text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c} value={c}>
                      {tCommon(`countries.${c}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  {t('form.city')}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Dubai, Istanbul, Batumi..."
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl bg-sand/60 border text-navy text-sm focus:outline-none focus:ring-1 focus:ring-gold',
                    errors.city ? 'border-red-500' : 'border-line'
                  )}
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-red-600">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  {t('form.area')}
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Dubai Marina, Vake, Kadikoy..."
                  className="w-full px-4 py-2.5 rounded-xl bg-sand/60 border border-line text-navy text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: Highlights & Ownership ================= */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-serif text-xl font-bold text-navy">
                {t('form.step3Title')}
              </h3>
              <p className="text-xs sm:text-sm text-muted mt-1">
                {t('form.step3Subtitle')}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                {t('form.description')}
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('form.descriptionPlaceholder')}
                className={cn(
                  'w-full px-4 py-3 rounded-xl bg-sand/60 border text-navy text-sm focus:outline-none focus:ring-1 focus:ring-gold leading-relaxed',
                  errors.description ? 'border-red-500' : 'border-line'
                )}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                {t('form.notes')}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('form.notesPlaceholder')}
                className="w-full px-4 py-3 rounded-xl bg-sand/60 border border-line text-navy text-sm focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
          </div>
        )}

        {/* ================= STEP 4: Contact & Verification ================= */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-serif text-xl font-bold text-navy">
                {t('form.step4Title')}
              </h3>
              <p className="text-xs sm:text-sm text-muted mt-1">
                {t('form.step4Subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  {t('form.name')}
                </label>
                <input
                  type="text"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder="Your full name"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl bg-sand/60 border text-navy text-sm focus:outline-none focus:ring-1 focus:ring-gold',
                    errors.sellerName ? 'border-red-500' : 'border-line'
                  )}
                />
                {errors.sellerName && (
                  <p className="mt-1 text-xs text-red-600">{errors.sellerName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  {t('form.email')}
                </label>
                <input
                  type="email"
                  value={sellerEmail}
                  onChange={(e) => setSellerEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl bg-sand/60 border text-navy text-sm focus:outline-none focus:ring-1 focus:ring-gold',
                    errors.sellerEmail ? 'border-red-500' : 'border-line'
                  )}
                />
                {errors.sellerEmail && (
                  <p className="mt-1 text-xs text-red-600">{errors.sellerEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                  {t('form.phone')}
                </label>
                <input
                  type="tel"
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  placeholder="+971 50 123 4567"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl bg-sand/60 border text-navy text-sm focus:outline-none focus:ring-1 focus:ring-gold',
                    errors.sellerPhone ? 'border-red-500' : 'border-line'
                  )}
                />
                {errors.sellerPhone && (
                  <p className="mt-1 text-xs text-red-600">{errors.sellerPhone}</p>
                )}
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-line text-gold focus:ring-gold cursor-pointer"
                />
                <span className="text-xs text-muted leading-relaxed select-none">
                  {t('form.consent')}
                </span>
              </label>
              {errors.consentGiven && (
                <p className="mt-1.5 text-xs text-red-600">{errors.consentGiven}</p>
              )}
            </div>
          </div>
        )}

        {/* Stepper Navigation Buttons */}
        <div className="mt-8 pt-6 border-t border-line flex items-center justify-between gap-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-line text-navy text-xs sm:text-sm font-semibold hover:bg-sand transition-colors"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{t('form.prevStep')}</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-navy text-sand text-xs sm:text-sm font-semibold hover:bg-gold hover:text-navy transition-colors"
            >
              <span>{t('form.nextStep')}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gold text-navy text-xs sm:text-sm font-bold shadow-md hover:bg-gold/90 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('form.submitting')}</span>
                </>
              ) : (
                <>
                  <span>{t('form.submit')}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

