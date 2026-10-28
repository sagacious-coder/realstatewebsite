import React from 'react';
import { CheckCircle2, Flame, Sparkles, Clock, Building, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'verified'
  | 'hot-deal'
  | 'hot_deal'
  | 'new-launch'
  | 'new_launch'
  | 'ready'
  | 'off-plan'
  | 'off_plan'
  | 'sold'
  | 'reserved';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant;
  showIcon?: boolean;
  label?: string;
}

const BASE_BADGE_CONFIG = {
  verified: {
    defaultLabel: 'Verified',
    className: 'bg-mist text-emerald-deep border-emerald/30 font-semibold',
    icon: ShieldCheck,
  },
  'hot-deal': {
    defaultLabel: 'Hot deal',
    className: 'bg-[#FFF8EA] text-gold-deep border-gold/40 font-semibold',
    icon: Flame,
  },
  'new-launch': {
    defaultLabel: 'New launch',
    className: 'bg-[#EBF1FA] text-sea border-sea/30 font-semibold',
    icon: Sparkles,
  },
  ready: {
    defaultLabel: 'Ready',
    className: 'bg-mist text-emerald font-semibold border-emerald/30',
    icon: CheckCircle2,
  },
  'off-plan': {
    defaultLabel: 'Off-plan',
    className: 'bg-navy/10 text-navy font-semibold border-navy/20',
    icon: Building,
  },
  sold: {
    defaultLabel: 'Sold',
    className: 'bg-line/60 text-muted font-medium border-line line-through opacity-85',
    icon: Clock,
  },
  reserved: {
    defaultLabel: 'Reserved',
    className: 'bg-[#FDF6E2] text-[#8C6D1F] font-medium border-[#E5C97A]',
    icon: Clock,
  },
};

const BADGE_CONFIG: Record<
  BadgeVariant,
  { defaultLabel: string; className: string; icon: React.ElementType }
> = {
  ...BASE_BADGE_CONFIG,
  hot_deal: BASE_BADGE_CONFIG['hot-deal'],
  new_launch: BASE_BADGE_CONFIG['new-launch'],
  off_plan: BASE_BADGE_CONFIG['off-plan'],
};

/**
 * Badge component adhering to Section 4.4 & 13.6:
 * - Variants: Verified, Hot deal, New launch, Ready, Off-plan, Sold, Reserved
 * - Never relies on color alone (Section 13.6 rule: carries both icon and text)
 */
export function Badge({
  variant,
  showIcon = true,
  label,
  className,
  ...rest
}: BadgeProps) {
  const config = BADGE_CONFIG[variant];
  const Icon = config.icon;
  const text = label || config.defaultLabel;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-[4px] border select-none transition-colors duration-150',
        config.className,
        className
      )}
      {...rest}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />}
      <span className="leading-tight">{text}</span>
    </span>
  );
}

export default Badge;
