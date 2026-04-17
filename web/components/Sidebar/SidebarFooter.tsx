import { cn } from '@flow/core';
import React from 'react';

export type SidebarFooterProps = React.ComponentPropsWithoutRef<'div'>;

const SidebarFooter: React.FC<SidebarFooterProps> = ({ children, className, ...props }) => {
  return (
    <div className={cn('flex flex-col gap-y-3 px-3 pb-3', className)} {...props}>
      {children}
    </div>
  );
};

export default SidebarFooter;
