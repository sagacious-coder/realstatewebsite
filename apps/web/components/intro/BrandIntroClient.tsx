'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { BrandIntroProps } from './BrandIntro';

const BrandIntroDynamic = dynamic(
  () => import('./BrandIntro').then((mod) => mod.BrandIntro),
  {
    ssr: false,
    loading: () => (
      <div
        id="brand-intro-overlay"
        className="fixed inset-0 z-[100] bg-[#101B33] flex flex-col items-center justify-center pointer-events-auto"
        aria-hidden="true"
      />
    ),
  }
);

export function BrandIntroClient(props: BrandIntroProps) {
  return <BrandIntroDynamic {...props} />;
}

export default BrandIntroClient;
