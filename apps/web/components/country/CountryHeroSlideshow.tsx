'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Play, Pause, ChevronLeft, ChevronRight, Search, MapPin, Building2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { CountryCode, Location } from '@/lib/data';

export interface CountryHeroSlideshowProps {
  countryCode: CountryCode;
  countryName: string;
  locale: string;
  locations?: Location[];
}

interface SlideInfo {
  landscape: string;
  portrait: string;
  alt: string;
}

const COUNTRY_SLIDES: Record<CountryCode, SlideInfo[]> = {
  ae: [
    {
      landscape: '/images/uae/hero/hero-01.webp',
      portrait: '/images/uae/hero/hero-01-portrait.webp',
      alt: 'Luxury waterfront skyline and residences in Dubai, UAE',
    },
    {
      landscape: '/images/uae/hero/hero-02.webp',
      portrait: '/images/uae/hero/hero-02-portrait.webp',
      alt: 'Premium beachfront villa community on Yas Island, Abu Dhabi',
    },
    {
      landscape: '/images/uae/hero/hero-03.webp',
      portrait: '/images/uae/hero/hero-03-portrait.webp',
      alt: 'Iconic architectural high-rise apartments in Dubai Marina',
    },
  ],
  tr: [
    {
      landscape: '/images/turkey/hero/hero-01.webp',
      portrait: '/images/turkey/hero/hero-01-portrait.webp',
      alt: 'Panoramic Bosphorus strait view and historic luxury homes in Istanbul',
    },
    {
      landscape: '/images/turkey/hero/hero-02.webp',
      portrait: '/images/turkey/hero/hero-02-portrait.webp',
      alt: 'Mediterranean coastal villas with private pools in Antalya',
    },
    {
      landscape: '/images/turkey/hero/hero-03.webp',
      portrait: '/images/turkey/hero/hero-03-portrait.webp',
      alt: 'Modern residential developments in vibrant Kadikoy, Istanbul',
    },
  ],
  ge: [
    {
      landscape: '/images/georgia/hero/hero-01.webp',
      portrait: '/images/georgia/hero/hero-01-portrait.webp',
      alt: 'Modern apart-hotel towers on the Black Sea boulevard in Batumi',
    },
    {
      landscape: '/images/georgia/hero/hero-02.webp',
      portrait: '/images/georgia/hero/hero-02-portrait.webp',
      alt: 'Scenic mountain and historic hillside residences in Old Tbilisi',
    },
    {
      landscape: '/images/georgia/hero/hero-03.webp',
      portrait: '/images/georgia/hero/hero-03-portrait.webp',
      alt: 'Contemporary premium residences in Vake district, Tbilisi',
    },
  ],
  eg: [
    {
      landscape: '/images/egypt/hero/hero-01.webp',
      portrait: '/images/egypt/hero/hero-01-portrait.webp',
      alt: 'Master-planned luxury gated compounds in New Cairo',
    },
    {
      landscape: '/images/egypt/hero/hero-02.webp',
      portrait: '/images/egypt/hero/hero-02-portrait.webp',
      alt: 'Pristine turquoise waters and Mediterranean beach chalets on the North Coast',
    },
    {
      landscape: '/images/egypt/hero/hero-03.webp',
      portrait: '/images/egypt/hero/hero-03-portrait.webp',
      alt: 'Iconic modern residential towers in the New Administrative Capital',
    },
  ],
};

const SLIDE_DURATION_MS = 6000;

export function CountryHeroSlideshow({
  countryCode,
  countryName,
  locale,
  locations = [],
}: CountryHeroSlideshowProps) {
  const t = useTranslations('countryHome');
  const router = useRouter();

  const slides = COUNTRY_SLIDES[countryCode] || COUNTRY_SLIDES.ae;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Search filter states
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const elapsedBeforePauseRef = useRef<number>(0);

  // Detect mobile viewport for portrait crop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsPlaying(false);
    }
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setProgress(0);
    elapsedBeforePauseRef.current = 0;
    startTimeRef.current = Date.now();
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
    elapsedBeforePauseRef.current = 0;
    startTimeRef.current = Date.now();
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setProgress(0);
    elapsedBeforePauseRef.current = 0;
    startTimeRef.current = Date.now();
  };

  const togglePlay = () => {
    if (isPlaying) {
      elapsedBeforePauseRef.current += Date.now() - startTimeRef.current;
      setIsPlaying(false);
    } else {
      startTimeRef.current = Date.now();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const remainingTime = Math.max(0, SLIDE_DURATION_MS - elapsedBeforePauseRef.current);
    startTimeRef.current = Date.now();

    timerRef.current = setTimeout(() => {
      nextSlide();
    }, remainingTime);

    const updateInterval = 50;
    progressIntervalRef.current = setInterval(() => {
      const elapsed = elapsedBeforePauseRef.current + (Date.now() - startTimeRef.current);
      const newProgress = Math.min(100, (elapsed / SLIDE_DURATION_MS) * 100);
      setProgress(newProgress);
    }, updateInterval);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying, currentSlide, nextSlide]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();
    if (selectedCity) queryParams.set('city', selectedCity);
    if (selectedType) queryParams.set('propertyType', selectedType);
    if (selectedBudget) queryParams.set('budget', selectedBudget);

    const searchStr = queryParams.toString();
    const targetUrl = `/${locale}/${countryCode}/buy${searchStr ? `?${searchStr}` : ''}`;
    router.push(targetUrl);
  };

  const cities = locations.filter((loc) => loc.type === 'city');

  return (
    <div className="relative w-full">
      {/* Hero Section Container with data-nav-hero */}
      <section
        data-nav-hero
        aria-label={`${countryName} property highlights`}
        className="relative min-h-[580px] w-full overflow-hidden bg-navy pt-28 pb-32 text-ivory md:min-h-[680px] md:pt-40 md:pb-44"
      >
        {/* Slide Images */}
        <div className="absolute inset-0 z-0">
          {slides.map((slide, idx) => {
            const isActive = idx === currentSlide;
            const imgSrc = isMobile ? slide.portrait : slide.landscape;

            return (
              <div
                key={slide.landscape}
                className={cn(
                  'absolute inset-0 transition-opacity duration-1000 ease-in-out',
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                )}
                aria-hidden={!isActive}
              >
                <Image
                  src={imgSrc}
                  alt={slide.alt}
                  fill
                  priority={idx === 0}
                  fetchPriority={idx === 0 ? 'high' : 'auto'}
                  sizes="100vw"
                  className="object-cover object-center filter brightness-[0.82]"
                />
              </div>
            );
          })}

          {/* Editorial Double Vignette for Readability */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-navy via-navy/40 to-navy/70" />
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-navy/60 via-transparent to-navy/60" />
        </div>

        {/* Content Overlay */}
        <div className="container relative z-20 mx-auto px-4 sm:px-6">
          <div className="max-w-3xl text-start">
            {/* Tagline / Flag Badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-[4px] border border-gold/40 bg-navy/80 px-3 py-1 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-gold-light">
                {t('hero.tagline')}
              </span>
            </div>

            {/* Editorial Heading */}
            <h1 className="h1 mb-4 text-3xl font-semibold tracking-tight text-ivory sm:text-4xl md:text-5xl lg:text-6xl font-serif">
              {t('hero.title', { country: countryName })}
            </h1>

            {/* Editorial Subtitle */}
            <p className="mb-8 text-base text-ivory/85 sm:text-lg md:text-xl font-sans leading-relaxed">
              {t('hero.subtitle')}
            </p>

            {/* Slideshow Controls Bar */}
            <div className="flex items-center gap-4 text-ivory/80">
              {/* Play / Pause Toggle Button */}
              <button
                type="button"
                onClick={togglePlay}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ivory/30 bg-navy/60 backdrop-blur-sm transition-all hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                aria-label={isPlaying ? t('hero.pause') : t('hero.play')}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </button>

              {/* Slide Indicators / Dots */}
              <div className="flex items-center gap-2">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => goToSlide(idx)}
                    className={cn(
                      'h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                      idx === currentSlide
                        ? 'w-8 bg-gold'
                        : 'w-2 bg-ivory/40 hover:bg-ivory/70'
                    )}
                    aria-label={`Go to slide ${idx + 1}`}
                    aria-current={idx === currentSlide ? 'true' : 'false'}
                  />
                ))}
              </div>

              {/* Prev / Next Arrows */}
              <div className="ms-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevSlide}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ivory/30 bg-navy/60 backdrop-blur-sm transition-all hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ivory/30 bg-navy/60 backdrop-blur-sm transition-all hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Gold Countdown Progress Bar at Bottom of Hero */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10 z-20">
          <div
            className="h-full bg-gold transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Slide time remaining"
          />
        </div>
      </section>

      {/* Rising Search Bar (Section 8.3 & 9): Overlapping the hero bottom */}
      <div className="container relative z-30 mx-auto -mt-14 sm:-mt-16 px-4 sm:px-6">
        <form
          onSubmit={handleSearch}
          className="rounded-[6px] border border-line bg-white p-4 shadow-xl sm:p-6 transition-all duration-300 hover:shadow-2xl"
          role="search"
          aria-label={t('hero.search.title')}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
            {/* Location Select */}
            <div className="space-y-1.5 text-start">
              <label htmlFor="hero-city-select" className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-gold-deep" />
                {t('hero.search.location')}
              </label>
              <div className="relative">
                <select
                  id="hero-city-select"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full appearance-none rounded-[4px] border border-line bg-ivory/40 py-2.5 ps-3 pe-8 text-sm text-navy font-medium focus:border-gold focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  <option value="">{t('hero.search.allLocations')}</option>
                  {cities.map((city) => (
                    <option key={city.slug} value={city.slug}>
                      {city.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center px-2 text-muted">
                  <ChevronRight className="h-4 w-4 rotate-90" />
                </div>
              </div>
            </div>

            {/* Property Type Select */}
            <div className="space-y-1.5 text-start">
              <label htmlFor="hero-type-select" className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-gold-deep" />
                {t('hero.search.propertyType')}
              </label>
              <div className="relative">
                <select
                  id="hero-type-select"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full appearance-none rounded-[4px] border border-line bg-ivory/40 py-2.5 ps-3 pe-8 text-sm text-navy font-medium focus:border-gold focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  <option value="">{t('hero.search.allTypes')}</option>
                  <option value="apartment">{t('hero.search.apartment')}</option>
                  <option value="villa">{t('hero.search.villa')}</option>
                  <option value="townhouse">{t('hero.search.townhouse')}</option>
                  <option value="penthouse">{t('hero.search.penthouse')}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center px-2 text-muted">
                  <ChevronRight className="h-4 w-4 rotate-90" />
                </div>
              </div>
            </div>

            {/* Budget / Price Range Select */}
            <div className="space-y-1.5 text-start">
              <label htmlFor="hero-budget-select" className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-gold-deep" />
                {t('hero.search.budget')}
              </label>
              <div className="relative">
                <select
                  id="hero-budget-select"
                  value={selectedBudget}
                  onChange={(e) => setSelectedBudget(e.target.value)}
                  className="w-full appearance-none rounded-[4px] border border-line bg-ivory/40 py-2.5 ps-3 pe-8 text-sm text-navy font-medium focus:border-gold focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  <option value="">{t('hero.search.anyBudget')}</option>
                  <option value="under500k">{t('hero.search.under500k')}</option>
                  <option value="500k-1m">{t('hero.search.range500kTo1m')}</option>
                  <option value="above1m">{t('hero.search.above1m')}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center px-2 text-muted">
                  <ChevronRight className="h-4 w-4 rotate-90" />
                </div>
              </div>
            </div>

            {/* Search Submit Button */}
            <div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full flex items-center justify-center gap-2 font-medium"
              >
                <Search className="h-4 w-4" />
                {t('hero.search.submit')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
