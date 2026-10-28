import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-[4px] bg-mist/60 border border-line/30',
        className
      )}
      {...props}
    />
  );
}

export default Skeleton;
