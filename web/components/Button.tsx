import { Button as FlowButton, type ButtonProps, cn } from '@flow/core';
import React from 'react';

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, className, children, ...props }, ref) => {
    return (
      <FlowButton
        ref={ref}
        variant={variant}
        className={cn(
          'rounded-full bg-slate-3 text-slate-11 hover:bg-slate-4 active:bg-slate-5 active:opacity-100 disabled:text-slate-8',
          variant === 'outline' && 'border border-slate-6',
          variant === 'default' && 'bg-blue-9 text-white hover:bg-blue-10 active:bg-blue-11',
          className,
        )}
        {...props}
      >
        {children}
      </FlowButton>
    );
  },
);

Button.displayName = 'Button';

export default Button;
