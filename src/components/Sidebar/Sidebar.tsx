import React from 'react';

import { cn } from '~/helpers/cn';

import { useSidebarContext } from './context';

export type SidebarProps = React.ComponentPropsWithoutRef<'nav'>;

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(({ className, ...props }, ref) => {
  const { isCollapsed, toggleCollapsed } = useSidebarContext();

  return (
    <>
      <nav
        ref={ref}
        className={cn(
          'fixed inset-y-0 left-0 z-1000 flex w-60 flex-col bg-red-500 transition-[width,translate] ease-linear',
          isCollapsed && '-translate-x-full sm:w-20 sm:translate-x-0',
          className,
        )}
        {...props}
      >
        Sidebar
      </nav>

      <div
        className={cn(
          'fixed inset-0 bg-black/50 opacity-0 transition-opacity ease-linear sm:hidden',
          isCollapsed ? 'pointer-events-none' : 'opacity-100',
        )}
        onClick={toggleCollapsed}
      ></div>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
