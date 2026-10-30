'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { COOKIE_INTRO_SEEN } from '@/lib/countries';
import { cn } from '@/lib/utils';

export interface BrandIntroProps {
  initialPlaying?: boolean;
}

/**
 * Animated Brand Intro - Section 8.2 & 13.3.
 *
 * Two-phase accessible dismissal pattern:
 * 1. State & Lifecycle:
 *    - `shouldRender`: only renders if sessionStorage('wh_intro_seen') is falsy and prefers-reduced-motion is false.
 *    - `isFadingOut`: set to true when dismissed; immediately applies `pointer-events-none opacity-0 transition-opacity duration-300`.
 *    - Unmounts cleanly via setTimeout(() => setShouldRender(false), 300) so no ghost DOM node remains.
 * 2. Trigger Coverage:
 *    - Full-screen click: onClick={dismiss} bound to fixed inset-0 z-50 bg-navy cursor-pointer.
 *    - Keyboard listener: Escape and Space on window, cleaned up on unmount.
 *    - Explicit Skip Button: accessible pill in the top-right corner (aria-label="Skip intro"), calling dismiss() with stopPropagation.
 *    - Fail-safe timer: automatically triggers dismiss() at 2.8 seconds.
 */
export function BrandIntro({ initialPlaying = true }: BrandIntroProps) {
  const t = useTranslations('intro');
  const [shouldRender, setShouldRender] = useState(initialPlaying);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const isDismissedRef = useRef(false);

  const dismiss = useCallback(() => {
    if (isDismissedRef.current) return;
    isDismissedRef.current = true;

    try {
      sessionStorage.setItem('wh_intro_seen', '1');
    } catch {
      // Ignore private browsing storage restrictions
    }

    // Set session cookie for SSR synchronization
    document.cookie = `${COOKIE_INTRO_SEEN}=1; path=/; SameSite=Lax`;

    // Phase 1: Fade out overlay smoothly over 300ms
    setIsFadingOut(true);

    // Phase 2: Unmount cleanly so zero ghost DOM nodes remain
    setTimeout(() => {
      setShouldRender(false);
      document.body.style.overflow = '';
    }, 300);
  }, []);

  useEffect(() => {
    // 1. If already seen in this session via sessionStorage or cookie, dismiss immediately
    try {
      if (
        sessionStorage.getItem('wh_intro_seen') === '1' ||
        document.cookie.indexOf(`${COOKIE_INTRO_SEEN}=1`) !== -1
      ) {
        setShouldRender(false);
        return;
      }
    } catch {}

    // 2. Check prefers-reduced-motion: if active, set flag and do not render
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      try {
        sessionStorage.setItem('wh_intro_seen', '1');
      } catch {}
      document.cookie = `${COOKIE_INTRO_SEEN}=1; path=/; SameSite=Lax`;
      setShouldRender(false);
      return;
    }

    if (!shouldRender) return;

    // Prevent background scrolling while intro is active
    document.body.style.overflow = 'hidden';

    // 3. Fail-safe timer: automatically trigger dismiss at 2.8 seconds
    const timer = setTimeout(() => {
      dismiss();
    }, 2800);

    // 4. Keyboard listener: Escape and Space triggers
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        dismiss();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [shouldRender, dismiss]);

  if (!shouldRender) {
    return null;
  }

  return (
    <>
      <div
        id="brand-intro-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        onClick={dismiss}
        className={cn(
          'fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy px-6 text-ivory cursor-pointer select-none transition-opacity duration-300',
          isFadingOut ? 'pointer-events-none opacity-0' : 'opacity-100'
        )}
      >
        <style>{`
          @keyframes introDrawArch {
            0% {
              stroke-dashoffset: 1250;
            }
            100% {
              stroke-dashoffset: 0;
            }
          }
          @keyframes introDrawBase {
            0% {
              stroke-dashoffset: 600;
            }
            100% {
              stroke-dashoffset: 0;
            }
          }
          @keyframes introDrawWave {
            0% {
              stroke-dashoffset: 550;
            }
            100% {
              stroke-dashoffset: 0;
            }
          }
          @keyframes introFadeInScale {
            0% {
              opacity: 0;
              transform: scale(0.92);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes introFadeSlideUp {
            0% {
              opacity: 0;
              transform: translateY(24px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes introGrowCypress {
            0% {
              opacity: 0;
              transform: scaleY(0.1);
            }
            100% {
              opacity: 1;
              transform: scaleY(1);
            }
          }
          @keyframes introSimpleFade {
            0% {
              opacity: 0;
            }
            100% {
              opacity: 1;
            }
          }

          .anim-arch-outer {
            stroke-dasharray: 1300;
            stroke-dashoffset: 1300;
            animation: introDrawArch 0.85s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
          }
          .anim-arch-inner {
            stroke-dasharray: 1200;
            stroke-dashoffset: 1200;
            animation: introDrawArch 0.95s cubic-bezier(0.2, 0.9, 0.3, 1) 0.05s forwards;
          }
          .anim-base-line {
            stroke-dasharray: 600;
            stroke-dashoffset: 600;
            animation: introDrawBase 0.7s cubic-bezier(0.2, 0.9, 0.3, 1) 0.15s forwards;
          }
          .anim-sky-sun {
            opacity: 0;
            transform-origin: 600px 357px;
            animation: introFadeInScale 0.75s ease-out 0.35s forwards;
          }
          .anim-hills {
            opacity: 0;
            animation: introFadeSlideUp 0.7s ease-out 0.65s forwards;
          }
          .anim-cypress {
            opacity: 0;
            transform-origin: 456px 640px;
            animation: introGrowCypress 0.65s cubic-bezier(0.2, 0.9, 0.3, 1) 0.85s forwards;
          }
          .anim-towers {
            opacity: 0;
            animation: introFadeSlideUp 0.7s ease-out 1.05s forwards;
          }
          .anim-water {
            opacity: 0;
            animation: introSimpleFade 0.6s ease-out 1.35s forwards;
          }
          .anim-waves {
            stroke-dasharray: 550;
            stroke-dashoffset: 550;
            animation: introDrawWave 0.75s ease-out 1.45s forwards;
          }
          .anim-wordmark {
            opacity: 0;
            animation: introFadeSlideUp 0.65s cubic-bezier(0.2, 0.9, 0.3, 1) 1.65s forwards;
          }
        `}</style>

        {/* Explicit Accessible Skip Button Pill in Top-Right Corner */}
        <div className="absolute top-6 end-6 z-10" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismiss();
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-ivory/30 bg-navy/60 px-4 py-1.5 text-xs font-semibold tracking-wider text-ivory/80 uppercase backdrop-blur-sm transition-all hover:border-gold hover:text-gold hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-label="Skip intro"
          >
            <span>{t('skip') || 'Skip intro'}</span>
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {/* Center Animated Brand Emblem */}
        <div className="relative flex flex-col items-center justify-center max-w-[340px] sm:max-w-[420px] md:max-w-[460px] w-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="262 112 676 858"
            className="w-full h-auto drop-shadow-[0_12px_28px_rgba(0,0,0,0.45)]"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="introArch" gradientUnits="userSpaceOnUse" x1="380" y1="160" x2="820" y2="720">
                <stop offset="0" stopColor="#E0BC6C" />
                <stop offset="1" stopColor="#BC8F40" />
              </linearGradient>
              <linearGradient id="introBase" gradientUnits="userSpaceOnUse" x1="300" y1="0" x2="900" y2="0">
                <stop offset="0" stopColor="#D8B462" />
                <stop offset="0.5" stopColor="#BE9142" />
                <stop offset="1" stopColor="#D8B462" />
              </linearGradient>
              <linearGradient id="introSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FBF4E3" />
                <stop offset="1" stopColor="#FFFDF8" />
              </linearGradient>
              <linearGradient id="introSun" gradientUnits="userSpaceOnUse" x1="512" y1="270" x2="688" y2="445">
                <stop offset="0" stopColor="#E0BE75" />
                <stop offset="1" stopColor="#BC9244" />
              </linearGradient>
              <linearGradient id="introWater" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#3E72D0" />
                <stop offset="1" stopColor="#254E99" />
              </linearGradient>
              <clipPath id="introInsideClip">
                <path d="M387.0 720 V380 A213.0 213.0 0 0 1 813.0 380 V720 Z" />
              </clipPath>
            </defs>

            {/* Layer 1: Outer arch & Baseline */}
            <path
              d="M351 720 V380 A249 249 0 0 1 849 380 V720"
              fill="none"
              stroke="#E2CB9B"
              strokeWidth="3"
              className="anim-arch-outer"
            />

            <g clipPath="url(#introInsideClip)">
              {/* Layer 2: Sky & Sun */}
              <g className="anim-sky-sun">
                <rect x="360" y="140" width="480" height="590" fill="url(#introSky)" />
                <circle cx="600" cy="357" r="88" fill="url(#introSun)" />
              </g>

              {/* Layer 3: Hills */}
              <g className="anim-hills">
                <path
                  d="M370 590 L387 578 C440 520 520 505 580 515 C650 528 690 565 725 565 C775 565 800 540 813 514 L830 492 V660 H370 Z"
                  fill="#3FA37A"
                />
                <path
                  d="M480 610 C530 570 600 560 660 572 C720 585 760 620 813 620 V660 H480 Z"
                  fill="#2D8560"
                />
              </g>

              {/* Layer 4: Cypress Tree */}
              <g className="anim-cypress">
                <path
                  d="M456 460 C448 510 440 570 442 640 H470 C472 570 464 510 456 460 Z"
                  fill="#1E5C41"
                />
                <ellipse cx="456" cy="460" rx="9" ry="14" fill="#1E5C41" />
              </g>

              {/* Layer 5: Modern Towers */}
              <g className="anim-towers">
                {/* Tower 1 */}
                <rect x="520" y="440" width="42" height="170" fill="#FAF8F3" rx="1" />
                <rect x="527" y="455" width="8" height="12" fill="#C99E4C" opacity="0.85" />
                <rect x="545" y="455" width="8" height="12" fill="#C99E4C" opacity="0.85" />
                <rect x="527" y="480" width="8" height="12" fill="#C99E4C" opacity="0.85" />
                <rect x="545" y="480" width="8" height="12" fill="#C99E4C" opacity="0.85" />
                <rect x="527" y="505" width="8" height="12" fill="#C99E4C" opacity="0.85" />
                <rect x="545" y="505" width="8" height="12" fill="#C99E4C" opacity="0.85" />

                {/* Tower 2 */}
                <rect x="575" y="410" width="48" height="200" fill="#FAF8F3" rx="1" />
                <polygon points="575,410 599,380 623,410" fill="#FAF8F3" />
                <rect x="585" y="430" width="10" height="15" fill="#C99E4C" opacity="0.85" />
                <rect x="603" y="430" width="10" height="15" fill="#C99E4C" opacity="0.85" />
                <rect x="585" y="460" width="10" height="15" fill="#C99E4C" opacity="0.85" />
                <rect x="603" y="460" width="10" height="15" fill="#C99E4C" opacity="0.85" />
                <rect x="585" y="490" width="10" height="15" fill="#C99E4C" opacity="0.85" />
                <rect x="603" y="490" width="10" height="15" fill="#C99E4C" opacity="0.85" />

                {/* Tower 3 */}
                <rect x="635" y="455" width="38" height="155" fill="#FAF8F3" rx="1" />
                <rect x="643" y="475" width="8" height="12" fill="#C99E4C" opacity="0.85" />
                <rect x="657" y="475" width="8" height="12" fill="#C99E4C" opacity="0.85" />
                <rect x="643" y="500" width="8" height="12" fill="#C99E4C" opacity="0.85" />
                <rect x="657" y="500" width="8" height="12" fill="#C99E4C" opacity="0.85" />
              </g>

              {/* Layer 6: Water & Ripples */}
              <g className="anim-water">
                <rect x="360" y="610" width="480" height="110" fill="url(#introWater)" />
              </g>
              <g className="anim-waves">
                <path
                  d="M400 645 C440 640 480 650 520 645 C560 640 600 650 640 645 C680 640 720 650 760 645 C780 642 795 644 805 645"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  opacity="0.8"
                />
                <path
                  d="M420 675 C460 670 500 680 540 675 C580 670 620 680 660 675 C700 670 740 680 780 675"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  opacity="0.6"
                />
              </g>
            </g>

            {/* Inner gold frame arch */}
            <path
              d="M387 720 V380 A213 213 0 0 1 813 380 V720"
              fill="none"
              stroke="url(#introArch)"
              strokeWidth="5"
              className="anim-arch-inner"
            />

            {/* Base platform line */}
            <line
              x1="300"
              y1="720"
              x2="900"
              y2="720"
              stroke="url(#introBase)"
              strokeWidth="4"
              strokeLinecap="round"
              className="anim-base-line"
            />

            {/* Layer 7: Typography Wordmark */}
            <g className="anim-wordmark">
              {/* WILD HILLS serif glyph paths */}
              <path
                d="M322.938 860.643 308.153 816.149Q307.13 813.082 306.55 810.913Q305.97 808.743 305.831 807.251Q304.394 807.334 303.206 807.361Q302.017 807.389 300.912 807.472V802H323.933V806.56Q320.285 806.588 319 808.052Q317.715 809.517 318.875 813.718Q320.174 818.692 321.556 823.307Q322.938 827.922 324.292 832.759Q325.176 835.881 325.991 838.59Q326.807 841.298 327.719 845.25H327.83Q328.189 844.006 328.783 841.878Q329.377 839.75 330.068 837.401Q330.759 835.052 331.311 833.104Q331.864 831.156 332.113 830.271Q333.771 824.993 335.388 819.866Q337.004 814.74 338.441 810.166Q339.878 805.593 340.929 801.945H346.787Q347.81 805.399 349.081 809.351Q350.352 813.303 351.651 817.393Q352.95 821.483 354.208 825.407Q355.465 829.332 356.515 832.703Q357.51 835.826 358.408 839.06Q359.306 842.293 360.108 845.637H360.246Q360.992 843.067 361.807 840.248Q362.623 837.429 363.479 834.444Q364.585 830.962 365.428 828.143Q366.271 825.325 366.948 822.948Q367.625 820.571 368.219 818.457Q368.813 816.343 369.421 814.27Q369.918 812.474 370.678 810.526Q371.438 808.577 372.544 807.223Q371.107 807.306 369.172 807.348Q367.238 807.389 366.077 807.472V802H384.123V806.56Q381.968 806.726 380.351 807.61Q378.734 808.494 377.435 810.595Q376.137 812.695 374.838 816.564Q371.356 827.674 367.887 838.659Q364.419 849.644 360.854 860.643H355.106L344.383 828.862Q343.416 825.988 342.711 823.224Q342.006 820.461 341.315 817.891Q340.818 820.461 340.196 822.893Q339.574 825.325 338.801 827.895L328.548 860.643Z M421.625 806.56Q419.387 806.643 418.102 807.361Q416.816 808.08 416.305 809.793Q415.794 811.507 415.794 814.768V847.682Q415.794 849.92 415.725 851.841Q415.656 853.762 415.49 854.84Q416.872 854.701 418.723 854.646Q420.575 854.591 421.625 854.563V860.035H399.544V855.475Q401.865 855.365 403.109 854.66Q404.353 853.955 404.864 852.2Q405.375 850.446 405.375 847.267V814.16Q405.375 812.115 405.486 810.222Q405.596 808.329 405.679 807.196Q404.297 807.278 402.473 807.334Q400.649 807.389 399.544 807.472V802H421.625Z M441.827 860.035V855.475Q444.148 855.365 445.392 854.66Q446.635 853.955 447.147 852.2Q447.658 850.446 447.658 847.267V814.16Q447.658 812.115 447.768 810.222Q447.879 808.329 447.962 807.196Q446.58 807.278 444.756 807.334Q442.932 807.389 441.827 807.472V802H463.908V806.56Q461.669 806.643 460.384 807.361Q459.099 808.08 458.588 809.793Q458.077 811.507 458.077 814.768V847.792Q458.077 850.031 458.008 851.882Q457.938 853.734 457.773 854.812L470.347 854.729Q475.349 854.701 478.099 851.357Q480.848 848.013 480.848 841.049H485.491L484.994 860.035Z M502.764 855.475Q505.085 855.365 506.329 854.66Q507.572 853.955 508.083 852.2Q508.595 850.446 508.595 847.267V814.16Q508.595 812.115 508.705 810.222Q508.816 808.329 508.899 807.196Q507.517 807.278 505.693 807.334Q503.869 807.389 502.764 807.472V802L525.37 801.917Q533.329 801.917 539.409 804.128Q545.489 806.339 549.565 810.305Q553.641 814.27 555.728 819.507Q557.814 824.744 557.814 830.658Q557.814 835.937 555.962 841.16Q554.111 846.383 550.242 850.625Q546.373 854.867 540.307 857.451Q534.241 860.035 525.839 860.035H502.764ZM519.013 847.709Q519.013 849.948 518.944 851.855Q518.875 853.762 518.71 854.84Q520.008 854.812 521.597 854.853Q523.186 854.895 524.665 854.922Q526.143 854.95 526.917 854.95Q531.754 854.95 535.388 853.071Q539.022 851.192 541.467 847.944Q543.913 844.697 545.143 840.51Q546.373 836.324 546.373 831.708Q546.373 823.445 543.872 817.932Q541.371 812.419 536.617 809.586Q531.864 806.753 524.955 806.643Q522.606 806.588 521.293 807.306Q519.981 808.025 519.497 809.766Q519.013 811.507 519.013 814.657Z M613.611 860.035V855.475Q615.932 855.365 617.176 854.66Q618.419 853.955 618.93 852.2Q619.442 850.446 619.442 847.267V814.16Q619.442 812.115 619.552 810.222Q619.663 808.329 619.746 807.196Q618.364 807.278 616.54 807.334Q614.716 807.389 613.611 807.472V802H635.692V806.56Q633.453 806.643 632.168 807.361Q630.883 808.08 630.372 809.793Q629.861 811.507 629.861 814.768V827.978H654.954V814.16Q654.954 812.115 655.037 810.222Q655.119 808.329 655.258 807.196Q653.876 807.278 652.052 807.334Q650.228 807.389 649.123 807.472V802H671.204V806.56Q668.965 806.643 667.68 807.361Q666.395 808.08 665.884 809.793Q665.372 811.507 665.372 814.768V847.682Q665.372 849.92 665.303 851.841Q665.234 853.762 665.068 854.84Q666.45 854.701 668.302 854.646Q670.153 854.591 671.204 854.563V860.035H649.123V855.475Q651.444 855.365 652.688 854.66Q653.931 853.955 654.442 852.2Q654.954 850.446 654.954 847.267V833.284L629.861 833.56V847.682Q629.861 849.92 629.791 851.841Q629.722 853.762 629.557 854.84Q630.938 854.701 632.79 854.646Q634.642 854.591 635.692 854.563V860.035Z M713.459 806.56Q711.22 806.643 709.935 807.361Q708.65 808.08 708.139 809.793Q707.628 811.507 707.628 814.768V847.682Q707.628 849.92 707.558 851.841Q707.489 853.762 707.324 854.84Q708.705 854.701 710.557 854.646Q712.409 854.591 713.459 854.563V860.035H691.378V855.475Q693.699 855.365 694.943 854.66Q696.186 853.955 696.698 852.2Q697.209 850.446 697.209 847.267V814.16Q697.209 812.115 697.319 810.222Q697.43 808.329 697.513 807.196Q696.131 807.278 694.307 807.334Q692.483 807.389 691.378 807.472V802H713.459Z M733.66 860.035V855.475Q735.982 855.365 737.225 854.66Q738.469 853.955 738.98 852.2Q739.491 850.446 739.491 847.267V814.16Q739.491 812.115 739.602 810.222Q739.713 808.329 739.795 807.196Q738.414 807.278 736.59 807.334Q734.766 807.389 733.66 807.472V802H755.741V806.56Q753.503 806.643 752.218 807.361Q750.933 808.08 750.422 809.793Q749.91 811.507 749.91 814.768V847.792Q749.91 850.031 749.841 851.882Q749.772 853.734 749.606 854.812L762.18 854.729Q767.183 854.701 769.932 851.357Q772.682 848.013 772.682 841.049H777.325L776.827 860.035Z M794.597 860.035V855.475Q796.919 855.365 798.162 854.66Q799.406 853.955 799.917 852.2Q800.428 850.446 800.428 847.267V814.16Q800.428 812.115 800.539 810.222Q800.649 808.329 800.732 807.196Q799.351 807.278 797.527 807.334Q795.703 807.389 794.597 807.472V802H816.678V806.56Q814.44 806.643 813.155 807.361Q811.87 808.08 811.358 809.793Q810.847 811.507 810.847 814.768V847.792Q810.847 850.031 810.778 851.882Q810.709 853.734 810.543 854.812L823.117 854.729Q828.119 854.701 830.869 851.357Q833.619 848.013 833.619 841.049H838.262L837.764 860.035Z M888.725 820.24Q888.144 815.818 886.32 812.557Q884.496 809.296 881.484 807.5Q878.472 805.703 874.243 805.759Q870.153 805.759 867.445 808.052Q864.737 810.346 864.737 813.745Q864.737 816.619 866.367 818.678Q867.998 820.737 871.052 822.437Q874.105 824.136 878.334 825.96Q881.484 827.259 884.745 828.903Q888.006 830.548 890.742 832.759Q893.478 834.969 895.15 837.94Q896.822 840.911 896.822 844.946Q896.822 849.727 894.293 853.458Q891.765 857.189 887.149 859.275Q882.534 861.362 876.206 861.362Q872.751 861.362 868.855 860.311Q864.958 859.261 861.669 857.244L861.973 860.754H856.28L856.114 841.934H860.84Q861.752 849.008 866.091 852.615Q870.43 856.221 876.482 856.221Q879.55 856.221 881.954 855.102Q884.358 853.983 885.726 852.021Q887.094 850.059 887.094 847.571Q887.094 844.393 885.077 842.293Q883.059 840.193 879.992 838.7Q876.924 837.208 873.635 835.826Q869.932 834.251 866.616 832.482Q863.3 830.714 860.743 828.434Q858.187 826.154 856.736 823.141Q855.285 820.129 855.285 816.094Q855.285 813.662 856.197 810.982Q857.109 808.301 859.223 805.966Q861.338 803.631 864.916 802.152Q868.495 800.673 873.829 800.673Q877.09 800.673 881.028 801.627Q884.966 802.58 887.978 804.736L887.647 801.281H893.367V820.24Z"
                fill="#FAF8F3"
              />
              {/* REAL ESTATE subhead */}
              <path
                d="M445.589 935.642 440.629 927.024H437.932V935.642H434.398V914.097H441.838Q444.318 914.097 446.039 914.965Q447.759 915.833 448.612 917.29Q449.464 918.747 449.464 920.545Q449.464 922.653 448.24 924.374Q447.015 926.094 444.473 926.714L449.805 935.642ZM437.932 924.203H441.838Q443.822 924.203 444.83 923.211Q445.837 922.219 445.837 920.545Q445.837 918.871 444.845 917.926Q443.853 916.98 441.838 916.98H437.932Z M471.784 916.949V923.273H479.224V926.156H471.784V932.759H480.154V935.642H468.25V914.066H480.154V916.949Z M511.743 931.24H502.722L501.172 935.642H497.483L505.202 914.066H509.294L517.013 935.642H513.293ZM510.751 928.357 507.248 918.344 503.714 928.357Z M538.155 932.79H545.44V935.642H534.621V914.097H538.155Z M594.699 916.949V923.273H602.139V926.156H594.699V932.759H603.069V935.642H591.165V914.066H603.069V916.949Z M621.142 929.69H624.924Q625.048 931.085 626.025 931.984Q627.001 932.883 628.768 932.883Q630.597 932.883 631.62 931.9996Q632.643 931.116 632.643 929.721Q632.643 928.636 632.007 927.954Q631.372 927.272 630.427 926.9Q629.481 926.528 627.807 926.094Q625.699 925.536 624.382 924.963Q623.064 924.389 622.134 923.18Q621.204 921.971 621.204 919.956Q621.204 918.096 622.134 916.701Q623.064 915.306 624.738 914.562Q626.412 913.818 628.613 913.818Q631.744 913.818 633.743 915.384Q635.743 916.949 635.96 919.677H632.054Q631.961 918.499 630.938 917.662Q629.915 916.825 628.241 916.825Q626.722 916.825 625.761 917.6Q624.8 918.375 624.8 919.832Q624.8 920.824 625.404 921.46Q626.009 922.095 626.939 922.467Q627.869 922.839 629.481 923.273Q631.62 923.862 632.969 924.451Q634.317 925.04 635.262 926.265Q636.208 927.489 636.208 929.535Q636.208 931.178 635.325 932.635Q634.441 934.092 632.751 934.976Q631.062 935.859 628.768 935.859Q626.598 935.859 624.862 935.1Q623.126 934.34 622.134 932.945Q621.142 931.55 621.142 929.69Z M668.572 914.097V916.98H662.837V935.642H659.303V916.98H653.537V914.097Z M699.386 931.24H690.365L688.815 935.642H685.126L692.845 914.066H696.937L704.656 935.642H700.936ZM698.394 928.357 694.891 918.344 691.357 928.357Z M736.183 914.097V916.98H730.448V935.642H726.914V916.98H721.148V914.097Z M757.542 916.949V923.273H764.982V926.156H757.542V932.759H765.912V935.642H754.008V914.066H765.912V916.949Z"
                fill="#8CD3AE"
              />
              {/* Flanking gold accent lines */}
              <line
                x1="328.073"
                y1="924.839"
                x2="398.073"
                y2="924.839"
                stroke="#C99E4C"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <line
                x1="801.927"
                y1="924.839"
                x2="871.927"
                y2="924.839"
                stroke="#C99E4C"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
          </svg>

          <p className="mt-6 text-center text-xs font-sans tracking-widest text-gold-light/60 uppercase">
            {t('clickToSkip')}
          </p>
        </div>
      </div>
      {/* Inline blocking script (Option B defense-in-depth): If sessionStorage has intro seen, hide immediately before first paint */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{if(sessionStorage.getItem('wh_intro_seen')==='1'){var el=document.getElementById('brand-intro-overlay');if(el){el.style.display='none';}}}catch(e){}})();`,
        }}
      />
    </>
  );
}
