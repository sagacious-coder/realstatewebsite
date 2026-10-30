'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Counter } from '@/components/Counter';
import { ShieldCheck, Percent, Award, Users } from 'lucide-react';

export function WhyWildHillsSection() {
  const t = useTranslations('countryHome.whyWildHills');

  const pillars = [
    {
      icon: ShieldCheck,
      title: t('pillars.p1Title'),
      desc: t('pillars.p1Desc'),
    },
    {
      icon: Percent,
      title: t('pillars.p2Title'),
      desc: t('pillars.p2Desc'),
    },
    {
      icon: Award,
      title: t('pillars.p3Title'),
      desc: t('pillars.p3Desc'),
    },
    {
      icon: Users,
      title: t('pillars.p4Title'),
      desc: t('pillars.p4Desc'),
    },
  ];

  return (
    <section
      id="why-wild-hills"
      className="bg-mist py-16 md:py-24 border-b border-line"
      aria-labelledby="why-heading"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeading
          kicker={t('kicker')}
          title={t('title')}
          subtitle={t('subtitle')}
          align="center"
          className="mx-auto max-w-2xl text-center"
        />

        {/* 4 Pillars Grid */}
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="rounded-[6px] border border-line/60 bg-white p-6 shadow-sm transition-all duration-300 hover:border-gold/60 hover:shadow-md text-start"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-[4px] bg-mist text-emerald">
                  <Icon className="h-6 w-6 text-emerald" />
                </div>
                <h3 className="mb-2 font-serif text-lg font-semibold text-navy">
                  {pillar.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted font-sans">
                  {pillar.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Animated Counter Strip (Section 4.5 & 8.3) */}
        <div className="mt-16 rounded-[6px] border border-gold/30 bg-white/90 p-8 shadow-sm backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            <Counter
              end={1200}
              prefix="$"
              suffix="M+"
              label={t('stats.volume')}
              isPlaceholder={true}
            />
            <Counter
              end={4}
              suffix=""
              label={t('stats.markets')}
              isPlaceholder={false}
            />
            <Counter
              end={100}
              suffix="%"
              label={t('stats.verified')}
              isPlaceholder={false}
            />
            <Counter
              end={49}
              suffix="/50"
              label={t('stats.satisfaction')}
              isPlaceholder={true}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

