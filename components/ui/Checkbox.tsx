'use client';

import React, { useId } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: React.ReactNode;
  description?: string;
}

/**
 * Accessible Checkbox adhering to Section 4.3 & 13.4:
 * - 4px radius, 1px line border, gold check indicator
 * - 44px min tap target touch area for mobile compliance
 */
export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, label, description, id, ...props }, ref) => {
  const generatedId = useId();
  const checkboxId = id || generatedId;

  return (
    <div className="flex items-start gap-3 select-none min-h-[44px] py-1">
      <CheckboxPrimitive.Root
        ref={ref}
        id={checkboxId}
        className={cn(
          'peer h-5 w-5 shrink-0 rounded-[4px] border border-line bg-white transition-colors duration-150',
          'focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'data-[state=checked]:bg-navy data-[state=checked]:border-navy text-gold',
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          className={cn('flex items-center justify-center text-current')}
        >
          <Check className="h-3.5 w-3.5 text-gold stroke-[2.5]" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>

      {(label || description) && (
        <div className="flex flex-col text-start">
          {label && (
            <label
              htmlFor={checkboxId}
              className="text-sm font-sans font-medium text-navy cursor-pointer leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-muted mt-1 leading-normal">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

Checkbox.displayName = CheckboxPrimitive.Root.displayName;
export default Checkbox;
