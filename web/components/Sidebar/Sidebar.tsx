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
            'fixed inset-y-0 left-0 z-1001 flex w-60 -translate-x-full flex-col border-r border-sidebar-border bg-sidebar transition-transform sm:hidden',
            isMobileOpen && 'translate-x-0',
            className,
          )}
          {...props}
        >
          {children}
        </nav>

        <div
          className={cn(
            'fixed inset-0 z-1000 bg-foreground/60 opacity-0 transition-opacity ease-tw-default sm:hidden',
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
        'relative hidden w-16 border-r border-sidebar-border bg-sidebar transition-[width] ease-tw-default sm:flex sm:flex-col',
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
