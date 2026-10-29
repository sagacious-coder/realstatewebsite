import React from 'react';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WhatsAppButtonProps {
  phone?: string;
  message?: string;
  label?: string;
  variant?: 'gold' | 'emerald' | 'outline' | 'iconOnly';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * WhatsAppButton: Section 4.4, 8.1
 * - Direct WhatsApp link formatted with wa.me
 * - Gold or emerald brand styling, 4px radius
 * - Lucide MessageCircle (stroke 1.5)
 * - Sentence case label or accessible icon-only button
 * - Minimum 44px tap target on mobile
 */
export function WhatsAppButton({
  phone = '+971400000000',
  message = 'Hello Wild Hills, I would like to inquire about properties.',
  label = 'WhatsApp us',
  variant = 'emerald',
  size = 'md',
  className,
}: WhatsAppButtonProps) {
  // Clean phone number (digits only, no spaces or plus)
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedMessage = encodeURIComponent(message);
  const href = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  const isIconOnly = variant === 'iconOnly';

  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2';

  const sizeStyles = {
    sm: isIconOnly ? 'h-9 w-9 rounded-[4px]' : 'h-9 px-3 text-xs gap-1.5 rounded-[4px]',
    md: isIconOnly ? 'h-11 w-11 rounded-[4px]' : 'h-11 px-4 text-sm gap-2 rounded-[4px]',
    lg: isIconOnly ? 'h-12 w-12 rounded-[4px]' : 'h-12 px-5 text-base gap-2.5 rounded-[4px]',
  }[size];

  const variantStyles = {
    gold: 'bg-gold text-navy hover:bg-[#b88c3a] active:bg-[#a67c2d] shadow-xs',
    emerald: 'bg-emerald text-white hover:bg-emerald-deep active:bg-[#0f432e] shadow-xs',
    outline: 'border border-line bg-white text-navy hover:bg-mist hover:border-gold/60',
    iconOnly: 'border border-line bg-white text-emerald hover:bg-mist hover:border-emerald',
  }[variant];

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={isIconOnly ? label : undefined}
      className={cn(baseStyles, sizeStyles, variantStyles, className)}
    >
      <MessageCircle
        className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}
        strokeWidth={1.5}
      />
      {!isIconOnly && <span>{label}</span>}
    </a>
  );
}
