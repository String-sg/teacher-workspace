import { cn } from '@flow/core';
import React from 'react';

import { useSidebarContext } from './context';

export type SidebarProps = React.ComponentPropsWithoutRef<'nav'>;

const Sidebar: React.FC<SidebarProps> = ({ className, children, ...props }) => {
  const { isOpen, isMobileOpen, isMobile, toggleSidebar } = useSidebarContext();

  if (isMobile) {
    return (
      <>
        <nav
          className={cn(
            'fixed inset-y-0 left-0 z-1001 w-60 -translate-x-full bg-slate-2 inset-shadow-[0_0_0_1px] inset-shadow-slate-5 transition-transform sm:hidden',
            isMobileOpen && 'translate-x-0',
            className,
          )}
          {...props}
        >
          {children}
        </nav>

        <div
          className={cn(
            'ease-tw-default fixed inset-0 z-1000 bg-slate-alpha-11/62 opacity-0 transition-opacity sm:hidden',
            isMobileOpen ? 'opacity-100' : 'pointer-events-none',
          )}
          onClick={toggleSidebar}
        />
      </>
    );
  }

  return (
    <nav
      className={cn(
        'ease-tw-default relative hidden w-16 bg-slate-2 inset-shadow-[0_0_0_1px] inset-shadow-slate-5 transition-[width] sm:block',
        isOpen && 'w-60',
        className,
      )}
      {...props}
    >
      {children}
    </nav>
  );
};

export default Sidebar;
