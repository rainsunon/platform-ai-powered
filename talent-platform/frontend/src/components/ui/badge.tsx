import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tracking-wider transition-colors select-none',
  {
    variants: {
      variant: {
        default: 'bg-primary-fixed text-on-primary-fixed-variant',
        secondary: 'bg-secondary-container text-on-secondary-container',
        outline: 'border border-outline-variant text-on-surface-variant',
        destructive: 'bg-error-container text-on-error-container',
        muted: 'bg-surface-container text-on-surface-variant',
        tertiary: 'bg-tertiary-fixed text-on-tertiary-container',
        manager: 'bg-primary-fixed text-on-primary-fixed-variant border border-primary/20',
        clientAdmin: 'bg-secondary-container text-on-secondary-container',
        clientStaff: 'bg-tertiary-fixed text-on-tertiary-container',
        clientPlanner: 'bg-[#f5f3ff] text-[#6d28d9]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
