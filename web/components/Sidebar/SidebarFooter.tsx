import { cn } from '@flow/core';
import React from 'react';

export type SidebarFooterProps = React.ComponentPropsWithoutRef<'div'>;

const SidebarFooter: React.FC<SidebarFooterProps> = ({ children, className, ...props }) => {
  return (
    <div className={cn('flex flex-col gap-y-sm px-sm pb-sm', className)} {...props}>
      {children}
    </div>
  );
};

export default SidebarFooter;
