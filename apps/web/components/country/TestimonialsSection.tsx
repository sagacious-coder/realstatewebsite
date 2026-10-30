'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Star, Quote } from 'lucide-react';
import type { CountryCode, Testimonial } from '@/lib/data';

export interface TestimonialsSectionProps {
  countryCode: CountryCode;
  testimonials: Testimonial[];
}

export function TestimonialsSection({
  countryCode,
  testimonials,
}: TestimonialsSectionProps) {
  const t = useTranslations('countryHome.testimonials');

  // Filter for country or fallback to all testimonials
  const countryTestimonials = testimonials.filter(
    (item) => !item.countryCode || item.countryCode === countryCode
  );

  const displayList = countryTestimonials.length > 0 ? countryTestimonials : testimonials;

  return (
    <section
      id="testimonials"
      className="bg-white py-16 md:py-24 border-b border-line"
      aria-labelledby="testimonials-heading"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeading
          kicker={t('kicker')}
          title={t('title')}
          subtitle={t('subtitle')}
          align="center"
          className="mx-auto max-w-2xl text-center"
        />

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {displayList.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="relative flex flex-col justify-between rounded-[6px] border border-line bg-ivory/30 p-6 sm:p-8 shadow-sm transition-all duration-300 hover:border-gold/60 hover:shadow-md text-start"
            >
              <div>
                {/* 5-Star Rating */}
                <div className="mb-4 flex items-center gap-1 text-gold">
                  {[...Array(item.rating || 5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                  ))}
                </div>

                {/* Quote */}
                <p className="mb-6 text-sm sm:text-base italic leading-relaxed text-navy font-serif">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              {/* Author & Origin */}
              <div className="border-t border-line/60 pt-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-navy font-sans">
                    {item.author}
                  </div>
                  <div className="text-xs text-muted">
                    {item.location}
                  </div>
                </div>
                <Quote className="h-6 w-6 text-gold/30" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
