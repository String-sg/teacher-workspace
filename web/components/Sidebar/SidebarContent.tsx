import { cn } from '@flow/core';
import React from 'react';

export type SidebarContentProps = React.ComponentPropsWithoutRef<'div'>;

const SidebarContent: React.FC<SidebarContentProps> = ({ children, className, ...props }) => {
  return (
    <div className={cn('flex flex-col gap-y-xs px-sm', className)} {...props}>
      {children}
    </div>
  );
};

export default SidebarContent;
