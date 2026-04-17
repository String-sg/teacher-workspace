import React from 'react';

import { cn } from '~/lib/utils';

export type SidebarContentProps = React.ComponentPropsWithoutRef<'div'>;

const SidebarContent: React.FC<SidebarContentProps> = ({ children, className, ...props }) => {
  return (
    <div className={cn('flex flex-1 flex-col gap-y-1.5 px-2', className)} {...props}>
      {children}
    </div>
  );
};

export default SidebarContent;
