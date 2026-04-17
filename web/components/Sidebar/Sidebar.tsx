import React from 'react';

import { cn } from '~/lib/utils';

import { useSidebarContext } from './context';

export type SidebarProps = React.ComponentPropsWithoutRef<'nav'>;

const EASE = 'ease-[cubic-bezier(0.22,0.61,0.36,1)]';

const Sidebar: React.FC<SidebarProps> = ({ className, children, ...props }) => {
  const { isOpen, isMobileOpen, isMobile, toggleSidebar } = useSidebarContext();

  if (isMobile) {
    return (
      <>
        <nav
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-60 -translate-x-full flex-col border-r border-border bg-muted transition-transform sm:hidden',
            isMobileOpen && 'translate-x-0',
            className,
          )}
          {...props}
        >
          {children}
        </nav>

        <div
          className={cn(
            EASE,
            'fixed inset-0 z-40 bg-foreground/60 opacity-0 transition-opacity sm:hidden',
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
        EASE,
        'relative hidden w-16 border-r border-border bg-muted transition-[width] sm:flex sm:flex-col',
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
