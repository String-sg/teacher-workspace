import React from 'react';

import { cn } from '~/lib/utils';

export type SidebarFooterProps = React.ComponentPropsWithoutRef<'div'>;

const SidebarFooter: React.FC<SidebarFooterProps> = ({ children, className, ...props }) => {
  return (
    <div className={cn('flex flex-col gap-y-2 px-2 pb-2', className)} {...props}>
      {children}
    </div>
  );
};

export default SidebarFooter;
