'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { SiteImage } from '@/components/SiteImage';
import { Clock, Calendar, ArrowRight } from 'lucide-react';
import type { CountryCode, BlogPost } from '@/lib/data';

export interface BlogSectionProps {
  countryCode: CountryCode;
  countryName: string;
  posts: BlogPost[];
}

export function BlogSection({
  countryCode,
  countryName,
  posts,
}: BlogSectionProps) {
  const t = useTranslations('countryHome.blog');
  const locale = useLocale();

  // Filter posts by country or fallback to all
  const countryPosts = posts.filter(
    (post) => !post.countryCode || post.countryCode === countryCode
  );

  const displayPosts = (countryPosts.length > 0 ? countryPosts : posts).slice(0, 3);

  const fallbackCovers = [
    '/images/blog/blog-cover-01.webp',
    '/images/blog/blog-cover-02.webp',
    '/images/blog/blog-cover-03.webp',
  ];

  return (
    <section
      id="market-insights"
      className="bg-white py-16 md:py-24 border-b border-line"
      aria-labelledby="blog-heading"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeading
          kicker={t('kicker')}
          title={t('title')}
          subtitle={t('subtitle', { country: countryName })}
          align="split"
        />

        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {displayPosts.map((post, index) => {
            const coverImage = post.coverImage || fallbackCovers[index % fallbackCovers.length];

            return (
              <article
                key={post.id}
                className="group flex flex-col overflow-hidden rounded-[6px] border border-line bg-white shadow-sm transition-all duration-300 hover:border-gold/60 hover:shadow-md text-start"
              >
                {/* 16:9 Image Frame */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-ivory">
                  <SiteImage
                    src={coverImage}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.03]"
                  />
                  {post.tags && post.tags.length > 0 && (
                    <div className="absolute top-3 start-3">
                      <span className="rounded-[4px] bg-navy/85 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-gold-light backdrop-blur-sm">
                        {post.tags[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    {/* Meta date & read time */}
                    <div className="mb-3 flex items-center gap-4 text-xs text-muted">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {post.publishedAt}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {post.readingTimeMinutes} {t('readTime')}
                      </span>
                    </div>

                    <h3 className="h3 mb-2 font-serif text-lg font-semibold text-navy transition-colors group-hover:text-gold-deep">
                      {post.title}
                    </h3>

                    <p className="line-clamp-2 text-sm text-muted leading-relaxed font-sans">
                      {post.summary}
                    </p>
                  </div>

                  {/* Read Link */}
                  <div className="mt-6 pt-4 border-t border-line/60">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold-deep transition-all group-hover:gap-2">
                      {t('readArticle')}
                      <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
