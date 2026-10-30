'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/Modal';
import { LeadForm } from '@/components/forms/LeadForm';
import { MessageCircle, Calendar, MapPin, Phone, Mail } from 'lucide-react';
import type { CountryCode, CountrySettings } from '@/lib/data';

export interface FinalCtaSectionProps {
  countryCode: CountryCode;
  countryName: string;
  settings: CountrySettings;
}

export function FinalCtaSection({
  countryCode,
  countryName,
  settings,
}: FinalCtaSectionProps) {
  const t = useTranslations('countryHome.cta');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cleanWhatsapp = (settings.supportWhatsapp || '').replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
    `Hello Wild Hills, I would like to inquire about real estate in ${countryName}.`
  )}`;

  return (
    <section
      id="advisory-cta"
      className="relative overflow-hidden bg-navy py-16 md:py-24 text-ivory border-t border-gold/30"
      aria-labelledby="cta-heading"
    >
      {/* Decorative architectural background lines */}
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <svg
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
        >
          <path
            d="M 100,600 C 100,200 1100,200 1100,600"
            stroke="#C99E4C"
            strokeWidth="2"
          />
          <path
            d="M 250,600 C 250,300 950,300 950,600"
            stroke="#C99E4C"
            strokeWidth="1"
          />
        </svg>
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Gold badge */}
          <span className="mb-4 inline-block rounded-[4px] border border-gold/40 bg-navy/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold-light">
            Private Client Desk
          </span>

          {/* Heading */}
          <h2
            id="cta-heading"
            className="h2 mb-4 font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-ivory"
          >
            {t('title', { country: countryName })}
          </h2>

          {/* Subtitle */}
          <p className="mb-8 text-base sm:text-lg text-ivory/80 leading-relaxed font-sans">
            {t('subtitle')}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            {/* WhatsApp direct chat button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-[4px] bg-[#25D366] px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#20ba59] shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <MessageCircle className="h-5 w-5 fill-white" />
              {t('whatsapp')}
            </a>

            {/* Book Consultation Modal Trigger */}
            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 font-semibold text-navy"
            >
              <Calendar className="h-5 w-5" />
              {t('bookConsultation')}
            </Button>
          </div>

          {/* Contact Strip */}
          <div className="grid grid-cols-1 gap-4 pt-8 border-t border-line/20 sm:grid-cols-3 text-start">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gold-light shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-gold-light">
                  {t('office')}
                </div>
                <div className="text-xs text-ivory/70 mt-1 leading-snug">
                  {settings.officeAddress}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-gold-light shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-gold-light">
                  {t('phone')}
                </div>
                <div className="text-xs text-ivory/70 mt-1">
                  {settings.supportPhone}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-gold-light shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-gold-light">
                  Email Desk
                </div>
                <div className="text-xs text-ivory/70 mt-1">
                  {settings.supportEmail}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Consultation Modal */}
      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Book Private Consultation · {countryName}</ModalTitle>
          </ModalHeader>
          <div className="p-2 text-start">
            <p className="text-sm text-muted mb-6">
              Share your preferred investment profile. An on-ground senior advisor in {countryName} will arrange a private confidential consultation.
            </p>
            <LeadForm
              propertyTitle={`${countryName} Portfolio Consultation`}
              defaultMessage={`Hello, I would like to book a private consultation regarding investments in ${countryName}.`}
              onSubmitSuccess={() => {
                setTimeout(() => setIsModalOpen(false), 2000);
              }}
            />
          </div>
        </ModalContent>
      </Modal>
    </section>
  );
}
