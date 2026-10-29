'use client';

import React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../utils';

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  currency?: string;
  formatValue?: (val: number) => string;
}

/**
 * Accessible Slider adhering to Section 13.5:
 * - Brand styling: line track, gold active range, navy thumb with gold ring
 * - Supports aria-valuetext with currency formatting
 */
export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, currency = 'USD', formatValue, value, defaultValue, ...props }, ref) => {
  const values = (value || defaultValue || [0]) as number[];

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex w-full touch-none select-none items-center py-4 cursor-pointer',
        className
      )}
      value={value}
      defaultValue={defaultValue}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-line">
        <SliderPrimitive.Range className="absolute h-full bg-gold" />
      </SliderPrimitive.Track>
      {values.map((val, index) => {
        const textVal = formatValue ? formatValue(val) : `${val.toLocaleString()} ${currency}`;
        return (
          <SliderPrimitive.Thumb
            key={index}
            aria-valuetext={textVal}
            className="block h-5 w-5 rounded-full border-2 border-gold bg-navy shadow-subtle transition-transform duration-100 hover:scale-110 focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50"
          />
        );
      })}
    </SliderPrimitive.Root>
  );
});

Slider.displayName = SliderPrimitive.Root.displayName;
export default Slider;
