import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-primary-container text-on-primary hover:opacity-95 shadow-sm active:scale-[0.99]',
        primary:
          'bg-primary text-on-primary hover:opacity-95 shadow-sm active:scale-[0.99]',
        secondary:
          'bg-surface-container hover:bg-surface-container-high text-on-surface shadow-xs active:scale-[0.99]',
        outline:
          'border border-outline-variant bg-transparent text-on-surface hover:bg-surface-container-low active:scale-[0.99]',
        ghost:
          'hover:bg-surface-container text-on-surface-variant hover:text-on-surface',
        destructive:
          'bg-error text-on-error hover:opacity-90 shadow-sm active:scale-[0.99]',
        destructiveGhost:
          'bg-error-container text-on-error-container hover:opacity-90',
        subtle:
          'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container',
      },
      size: {
        default: 'h-9 px-3.5 py-2',
        sm: 'h-8 px-2.5 py-1 text-xs',
        lg: 'h-11 px-5 text-base',
        icon: 'h-9 w-9 p-0',
        iconSm: 'h-7 w-7 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
