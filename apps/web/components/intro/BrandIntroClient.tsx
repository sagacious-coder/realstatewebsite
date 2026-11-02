'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { BrandIntroProps } from './BrandIntro';

const BrandIntroDynamic = dynamic(
  () => import('./BrandIntro').then((mod) => mod.BrandIntro),
  { ssr: false }
);

export function BrandIntroClient(props: BrandIntroProps) {
  return <BrandIntroDynamic {...props} />;
}

export default BrandIntroClient;

