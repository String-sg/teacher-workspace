import React from 'react';

import { cn } from '~/helpers/cn';

export type SidebarContentProps = React.ComponentPropsWithoutRef<'div'>;

const SidebarContent = React.forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('gap-y-xs flex flex-col', className)} {...props}>
        {children}
      </div>
    );
  },
);

SidebarContent.displayName = 'SidebarContent';

export default SidebarContent;
