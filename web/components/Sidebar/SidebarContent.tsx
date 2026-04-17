import { cn } from '@flow/core';
import React from 'react';

export type SidebarContentProps = React.ComponentPropsWithoutRef<'div'>;

const SidebarContent: React.FC<SidebarContentProps> = ({ children, className, ...props }) => {
  return (
    <div className={cn('flex flex-1 flex-col gap-y-2 px-3', className)} {...props}>
      {children}
    </div>
  );
};

export default SidebarContent;
