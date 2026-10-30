'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { SectionHeading } from '@/components/ui/SectionHeading';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/Accordion';
import type { CountryCode, FaqItem } from '@/lib/data';

export interface FaqSectionProps {
  countryCode: CountryCode;
  countryName: string;
  faqs: FaqItem[];
}

export function FaqSection({
  countryCode,
  countryName,
  faqs,
}: FaqSectionProps) {
  const t = useTranslations('countryHome.faq');

  // Filter FAQs for this country and general FAQs
  const relevantFaqs = faqs.filter(
    (faq) => !faq.countryCode || faq.countryCode === countryCode
  );

  return (
    <section
      id="faq"
      className="bg-ivory py-16 md:py-24 border-b border-line"
      aria-labelledby="faq-heading"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <SectionHeading
            kicker={t('kicker')}
            title={t('title', { country: countryName })}
            subtitle={t('subtitle', { country: countryName })}
            align="center"
            className="text-center mb-10"
          />

          <div className="rounded-[6px] border border-line bg-white p-6 sm:p-8 shadow-sm">
            <Accordion type="single" collapsible className="w-full">
              {relevantFaqs.map((faq, index) => (
                <AccordionItem key={faq.id || index} value={`faq-${index}`}>
                  <AccordionTrigger className="text-start">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
