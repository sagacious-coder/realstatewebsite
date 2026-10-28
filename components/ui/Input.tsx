import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  helper?: string;
}

/**
 * Accessible Input adhering to Section 4.3 & 13.4:
 * - 4px radius, 1px line border, 2px gold focus ring
 * - Always provides a visible label when requested
 * - Error message linked via aria-describedby and role="alert"
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, helper, id, type = 'text', ...props }, ref) => {
    const displayHint = helper || hint;
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const describedBy = [error ? errorId : null, displayHint ? hintId : null]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="w-full flex flex-col gap-1.5 text-start">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-sans font-medium text-navy select-none"
          >
            {label}
            {props.required && (
              <span className="text-gold-deep ms-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={type}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy || undefined}
            className={cn(
              'w-full h-11 px-3.5 text-sm font-sans text-navy bg-white rounded-[4px] border border-line',
              'placeholder:text-muted/60 transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2',
              'disabled:opacity-50 disabled:bg-mist/30 disabled:cursor-not-allowed',
              error ? 'border-red-600 focus-visible:outline-red-600' : 'hover:border-navy/40',
              className
            )}
            {...props}
          />
          {error && (
            <div className="absolute inset-y-0 end-3 flex items-center pointer-events-none text-red-600">
              <AlertCircle className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
            </div>
          )}
        </div>

        {displayHint && !error && (
          <p id={hintId} className="text-xs text-muted">
            {displayHint}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs text-red-600 font-medium flex items-center gap-1"
          >
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
