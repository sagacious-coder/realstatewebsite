'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LeadFormData {
  fullName: string;
  countryCode: string;
  phone: string;
  email: string;
  preferredLanguage: string;
  message: string;
  consent: boolean;
}

export interface LeadFormProps {
  propertyRef?: string;
  propertyTitle?: string;
  defaultMessage?: string;
  onSubmitSuccess?: (data: LeadFormData) => void;
  className?: string;
}

const COUNTRY_CODES = [
  { code: '+971', label: 'UAE (+971)' },
  { code: '+90', label: 'Turkey (+90)' },
  { code: '+995', label: 'Georgia (+995)' },
  { code: '+20', label: 'Egypt (+20)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+1', label: 'USA / Canada (+1)' },
  { code: '+49', label: 'Germany (+49)' },
];

/**
 * LeadForm: Section 4.4, 10.3, 13.4
 * - Full accessible lead capture form
 * - Visible labels on every field
 * - aria-describedby for errors
 * - Moves focus to first invalid field on error
 * - aria-live polite announcements
 * - Phone country code select + number
 * - Consent checkbox with privacy acknowledgment
 */
export function LeadForm({
  propertyRef,
  propertyTitle,
  defaultMessage,
  onSubmitSuccess,
  className,
}: LeadFormProps) {
  const [formData, setFormData] = useState<LeadFormData>({
    fullName: '',
    countryCode: '+971',
    phone: '',
    email: '',
    preferredLanguage: 'en',
    message: defaultMessage || (propertyTitle ? `I would like more information on ${propertyTitle} (${propertyRef || ''}).` : 'I would like to inquire about properties.'),
    consent: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Refs for focusing first invalid input
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLButtonElement>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Please enter your full name';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Please enter your phone number';
    } else if (formData.phone.replace(/[^0-9]/g, '').length < 6) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.consent) {
      newErrors.consent = 'You must agree to the privacy policy to proceed';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Focus first error field per 13.4
      if (newErrors.fullName && nameRef.current) {
        nameRef.current.focus();
      } else if (newErrors.phone && phoneRef.current) {
        phoneRef.current.focus();
      } else if (newErrors.email && emailRef.current) {
        emailRef.current.focus();
      } else if (newErrors.consent && consentRef.current) {
        consentRef.current.focus();
      }
      setStatusMessage(`Please correct the ${Object.keys(newErrors).length} errors in the form.`);
      return false;
    }

    setStatusMessage('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Simulate server action submission
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsSuccess(true);
      setStatusMessage('Thank you. Your request has been submitted successfully.');
      if (onSubmitSuccess) {
        onSubmitSuccess(formData);
      }
    } catch {
      setStatusMessage('Submission error. Please try again or contact us via WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div
        className={cn(
          'rounded-[6px] border border-line bg-white p-6 sm:p-8 text-center shadow-sm',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald/10 text-emerald">
          <CheckCircle2 className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <h3 className="font-serif text-xl font-medium text-navy">
          Inquiry received
        </h3>
        <p className="mt-2 text-sm text-muted">
          Our private advisory team will review your request and contact you within 24 hours.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setIsSuccess(false);
            setFormData({
              fullName: '',
              countryCode: '+971',
              phone: '',
              email: '',
              preferredLanguage: 'en',
              message: defaultMessage || '',
              consent: false,
            });
          }}
          className="mt-6"
        >
          Send another inquiry
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn(
        'flex flex-col gap-5 rounded-[6px] border border-line bg-white p-6 sm:p-8 shadow-sm',
        className
      )}
      aria-label="Property inquiry form"
    >
      {/* Live status announcement */}
      <div className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </div>

      <div>
        <h3 className="font-serif text-xl font-medium text-navy">
          {propertyTitle ? 'Request details & brochure' : 'Speak with an advisor'}
        </h3>
        <p className="mt-1 text-xs text-muted">
          Confidential advisory. No spam, no public listing of your details.
        </p>
      </div>

      {/* Full Name */}
      <Input
        ref={nameRef}
        label="Full name"
        id="lead-fullname"
        name="fullName"
        autoComplete="name"
        required
        value={formData.fullName}
        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        error={errors.fullName}
        placeholder="e.g. Alexander Vance"
      />

      {/* Phone Field with Country Code */}
      <div className="space-y-1.5">
        <label
          htmlFor="lead-phone"
          className="block text-xs font-semibold tracking-wider text-muted uppercase"
        >
          Phone number <span className="text-gold-deep">*</span>
        </label>
        <div className="flex gap-2">
          <div className="w-[130px] flex-shrink-0">
            <Select
              value={formData.countryCode}
              onValueChange={(val) => setFormData({ ...formData, countryCode: val })}
            >
              <SelectTrigger aria-label="Select country dial code">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_CODES.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Input
              ref={phoneRef}
              id="lead-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              error={errors.phone}
              placeholder="50 123 4567"
            />
          </div>
        </div>
      </div>

      {/* Email */}
      <Input
        ref={emailRef}
        label="Email address"
        id="lead-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={errors.email}
        placeholder="alexander@example.com"
      />

      {/* Preferred Language */}
      <div className="space-y-1.5">
        <label
          htmlFor="lead-language"
          className="block text-xs font-semibold tracking-wider text-muted uppercase"
        >
          Preferred language
        </label>
        <Select
          value={formData.preferredLanguage}
          onValueChange={(val) => setFormData({ ...formData, preferredLanguage: val })}
        >
          <SelectTrigger id="lead-language" aria-label="Preferred language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ar">العربية (Arabic)</SelectItem>
            <SelectItem value="tr">Türkçe (Turkish)</SelectItem>
            <SelectItem value="ka">ქართული (Georgian)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Message Textarea */}
      <div className="space-y-1.5">
        <label
          htmlFor="lead-message"
          className="block text-xs font-semibold tracking-wider text-muted uppercase"
        >
          Message / Specific requirements
        </label>
        <textarea
          id="lead-message"
          name="message"
          rows={3}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full rounded-[4px] border border-line bg-white px-3 py-2 text-sm text-navy placeholder:text-muted/60 transition-colors focus-visible:border-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
          placeholder="Tell us what you are looking for..."
        />
      </div>

      {/* Consent Checkbox */}
      <div className="space-y-1">
        <Checkbox
          ref={consentRef}
          id="lead-consent"
          checked={formData.consent}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, consent: Boolean(checked) })
          }
          label="I consent to Wild Hills contacting me regarding my inquiry and accept the terms of the privacy policy."
          required
        />
        {errors.consent && (
          <p
            id="lead-consent-error"
            className="flex items-center gap-1 text-xs text-red-700"
            role="alert"
          >
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
            <span>{errors.consent}</span>
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        className="w-full justify-center text-sm font-medium"
      >
        {isSubmitting ? (
          'Submitting request...'
        ) : (
          <>
            <Send className="h-4 w-4 me-2" strokeWidth={1.5} />
            Submit inquiry
          </>
        )}
      </Button>
    </form>
  );
}
