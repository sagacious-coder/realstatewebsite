'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { FileText, Download, CheckCircle, Scale, Building, ShieldCheck } from 'lucide-react';
import type { CountryCode, BuyingGuide } from '@/lib/data';

export interface BuyingGuideSectionProps {
  countryCode: CountryCode;
  countryName: string;
  guide: BuyingGuide | null;
}

export function BuyingGuideSection({
  countryCode,
  countryName,
  guide,
}: BuyingGuideSectionProps) {
  const t = useTranslations('countryHome.buyingGuide');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const icons = [Building, ShieldCheck, Scale];

  const handleDownload = () => {
    setDownloadSuccess(true);
    // In mock mode: trigger notification
    setTimeout(() => {
      // Mock download simulation
    }, 500);
  };

  return (
    <section
      id="buying-guide"
      className="bg-ivory py-16 md:py-24 border-b border-line"
      aria-labelledby="guide-heading"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeading
          kicker={t('kicker')}
          title={t('title', { country: countryName })}
          subtitle={t('subtitle')}
          align="start"
        />

        {guide && (
          <div className="mt-10 rounded-[6px] border border-line bg-white p-6 sm:p-10 shadow-sm">
            {/* Guide Header Banner */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-line">
              <div className="max-w-2xl text-start">
                <span className="mb-2 inline-flex items-center gap-1.5 rounded-[4px] bg-mist px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-emerald">
                  <FileText className="h-3.5 w-3.5" />
                  {guide.updatedDate ? `Updated ${guide.updatedDate}` : 'Latest Edition'}
                </span>
                <h3 className="h3 font-serif text-xl sm:text-2xl font-semibold text-navy mt-1">
                  {guide.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted font-sans">
                  {guide.summary}
                </p>
              </div>

              {/* Download Action */}
              <div className="flex-shrink-0">
                {downloadSuccess ? (
                  <div className="flex items-center gap-2 rounded-[4px] border border-emerald/30 bg-mist px-4 py-2.5 text-sm font-medium text-emerald">
                    <CheckCircle className="h-4 w-4" />
                    PDF Download initiated
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 font-medium"
                  >
                    <Download className="h-4 w-4" />
                    {t('downloadPdf')}
                  </Button>
                )}
              </div>
            </div>

            {/* Guide Content Pillars */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {guide.contentSections.map((section, idx) => {
                const Icon = icons[idx % icons.length];
                return (
                  <div
                    key={idx}
                    className="rounded-[4px] border border-line/60 bg-ivory/30 p-5 text-start transition-all hover:border-gold/40"
                  >
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded bg-white text-gold-deep border border-line shadow-2xs">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="font-serif text-base font-semibold text-navy mb-2">
                      {section.heading}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted leading-relaxed font-sans">
                      {section.body}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Editorial Disclaimer */}
            <p className="mt-8 text-xs text-muted/80 italic text-start border-t border-line/40 pt-4">
              {t('disclaimer')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
