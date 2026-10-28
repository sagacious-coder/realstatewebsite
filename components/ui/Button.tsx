import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'on-navy' | 'onNavy';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg' | 'icon';
  asChild?: boolean;
  isLoading?: boolean;
}

/**
 * Button component adhering to Section 4.1 & 4.4:
 * - primary: gold fill with navy text (Section 4.1 contrast rule)
 * - secondary / outline: navy outline
 * - ghost: subtle hover
 * - on-navy / onNavy: ivory outline for dark navy sections
 * - 4px radius, sentence case only (no uppercase), min 44px tap target on mobile
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      asChild = false,
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    const normalizedVariant: 'primary' | 'secondary' | 'ghost' | 'on-navy' =
      variant === 'outline' ? 'secondary' : variant === 'onNavy' ? 'on-navy' : variant;

    const baseStyles =
      'inline-flex items-center justify-center font-sans font-medium text-sm transition-colors duration-200 select-none rounded-[4px] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2';

    const variantStyles = {
      // Primary: always navy text on gold fill (Section 4.1 rule)
      primary:
        'bg-gold text-navy hover:bg-gold-deep hover:text-white focus-visible:outline-gold shadow-none',
      // Secondary: crisp 1px navy outline
      secondary:
        'border border-navy text-navy bg-transparent hover:bg-navy hover:text-ivory focus-visible:outline-navy',
      // Ghost: transparent with line/wash hover
      ghost:
        'text-navy bg-transparent hover:bg-mist hover:text-navy focus-visible:outline-gold',
      // On-navy: crisp ivory outline for dark sections
      'on-navy':
        'border border-ivory text-ivory bg-transparent hover:bg-ivory hover:text-navy focus-visible:outline-ivory',
    };

    const sizeStyles = {
      sm: 'h-9 px-3 text-xs min-h-[36px] sm:min-h-[36px]',
      md: 'h-11 px-5 text-sm min-h-[44px]', // 44px touch target compliance (Section 13.6)
      lg: 'h-12 px-7 text-base min-h-[48px]',
      icon: 'h-11 w-11 p-0 min-h-[44px] min-w-[44px]',
    };

    return (
      <Comp
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[normalizedVariant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 me-2 animate-spin" strokeWidth={1.5} />
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';
export default Button;
