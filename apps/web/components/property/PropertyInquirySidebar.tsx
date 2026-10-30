'use client';

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Phone, MessageCircle, Calendar, Send, ShieldCheck } from 'lucide-react';
import { SiteImage } from '@/components/SiteImage';
import { Button } from '@/components/ui/Button';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@/components/ui/Modal';
import { LeadForm } from '@/components/forms/LeadForm';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { cn } from '@/lib/utils';
import type { AgentBrief, CountryCode } from '@wild-hills/contracts';

export interface PropertyInquirySidebarProps {
  countryCode: CountryCode;
  listingId: string;
  refCode: string;
  title: string;
  priceMinor: number;
  originalCurrency: string;
  agent?: AgentBrief | null;
  className?: string;
}

export function PropertyInquirySidebar({
  countryCode,
  listingId,
  refCode,
  title,
  priceMinor,
  originalCurrency,
  agent,
  className,
}: PropertyInquirySidebarProps) {
  const t = useTranslations('property.inquiry');
  const locale = useLocale();
  const { formatPrice } = useCurrency();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'inquire' | 'viewing'>('inquire');

  const displayPrice = formatPrice(priceMinor, originalCurrency as any);

  // Agent fallbacks
  const agentName = agent?.name || t('agent');
  const agentPhone = agent?.phone || '+971 4 000 0000';
  const rawWhatsapp = (agent?.whatsapp || agent?.phone || '97140000000').replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${rawWhatsapp}?text=${encodeURIComponent(
    `Inquiry regarding ${refCode} - ${title}`
  )}`;

  const openInquiryModal = (mode: 'inquire' | 'viewing') => {
    setModalMode(mode);
    setModalOpen(true);
  };

  const defaultMessage =
    modalMode === 'viewing'
      ? `I would like to schedule a private viewing for ${title} (${refCode}). Please let me know available dates.`
      : `Hello, I am interested in ${title} (${refCode}) and would like to request the brochure, availability, and payment terms.`;

  return (
    <>
      {/* Desktop Sticky Sidebar Card */}
      <aside
        className={cn(
          'sticky top-24 rounded-card border border-line bg-white p-6 shadow-subtle space-y-6 text-start',
          className
        )}
        aria-label={t('title')}
      >
        {/* Price & Ref Tag */}
        <div className="border-b border-line pb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono uppercase text-muted font-semibold tracking-wider">
              <bdi>{refCode}</bdi>
            </span>
            <span className="text-[11px] font-medium text-emerald-deep bg-mist px-2 py-0.5 rounded-[3px]">
              Available
            </span>
          </div>
          <div className="font-serif text-2xl font-bold text-navy">
            <bdi>{displayPrice}</bdi>
          </div>
        </div>

        {/* Advisor Details */}
        <div className="flex items-center gap-3.5">
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-line bg-navy">
            {agent?.avatarUrl ? (
              <SiteImage
                src={agent.avatarUrl}
                alt={agentName}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-ivory font-serif font-bold text-sm bg-navy-2">
                WH
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-sm font-bold text-navy truncate">
              {agentName}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-muted">
              <ShieldCheck className="h-3 w-3 text-gold-deep" />
              <span className="truncate">{t('license')}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* WhatsApp Direct CTA */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full min-h-11 items-center justify-center gap-2 rounded-[4px] bg-[#25D366] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#20ba59] focus-visible:outline-2 focus-visible:outline-[#25D366]"
          >
            <MessageCircle className="h-4 w-4 fill-white" />
            <span>{t('whatsapp')}</span>
          </a>

          {/* Schedule a Viewing */}
          <Button
            variant="outline"
            className="w-full text-xs font-semibold border-line hover:border-gold flex items-center justify-center gap-2"
            onClick={() => openInquiryModal('viewing')}
          >
            <Calendar className="h-4 w-4 text-gold-deep" strokeWidth={1.5} />
            <span>{t('scheduleViewing')}</span>
          </Button>

          {/* Inquire Now */}
          <Button
            variant="primary"
            className="w-full text-xs font-semibold flex items-center justify-center gap-2"
            onClick={() => openInquiryModal('inquire')}
          >
            <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>{t('inquireNow')}</span>
          </Button>
        </div>

        {/* Telephone link */}
        <div className="pt-2 text-center">
          <a
            href={`tel:${agentPhone.replace(/\s+/g, '')}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-navy transition-colors"
          >
            <Phone className="h-3 w-3 text-gold-deep" />
            <span>{agentPhone}</span>
          </a>
        </div>
      </aside>

      {/* Mobile Sticky Action Bar */}
      <div
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden flex items-center justify-between gap-3 border-t border-line bg-white/95 backdrop-blur-md px-4 py-3 shadow-lg"
        role="region"
        aria-label="Mobile inquiry action bar"
      >
        <div className="text-start">
          <span className="text-[10px] text-muted block uppercase font-mono tracking-wider font-semibold">
            {refCode}
          </span>
          <div className="font-serif text-base font-bold text-navy leading-tight">
            <bdi>{displayPrice}</bdi>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile WhatsApp Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('whatsapp')}
            className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-[#25D366] text-white shadow-xs hover:bg-[#20ba59] transition-colors"
          >
            <MessageCircle className="h-4 w-4 fill-white" />
          </a>

          {/* Mobile Inquire Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => openInquiryModal('inquire')}
            className="text-xs font-semibold min-h-10 px-4"
          >
            {t('inquireNow')}
          </Button>
        </div>
      </div>

      {/* Inquiry Lead Modal */}
      <Modal open={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent className="max-w-lg p-6 bg-white rounded-card">
          <ModalHeader className="text-start pb-4 border-b border-line">
            <ModalTitle className="font-serif text-xl font-semibold text-navy">
              {modalMode === 'viewing' ? t('scheduleViewing') : t('formTitle')}
            </ModalTitle>
            <ModalDescription className="text-xs text-muted mt-1">
              {title} · <bdi className="font-mono font-semibold">{refCode}</bdi>
            </ModalDescription>
          </ModalHeader>

          <div className="pt-4">
            <LeadForm
              propertyRef={refCode}
              propertyTitle={title}
              defaultMessage={defaultMessage}
              onSubmitSuccess={() => {
                setTimeout(() => setModalOpen(false), 2000);
              }}
            />
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}

