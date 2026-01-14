import React from 'react';

import { cn } from '~/helpers/cn';

import { useSidebarContext } from './context';

export type SidebarProps = React.ComponentPropsWithoutRef<'nav'>;

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, children, ...props }, ref) => {
    const { isCollapsed, toggleCollapsed } = useSidebarContext();

    return (
      <>
        <nav
          ref={ref}
          className={cn(
            'bg-slate-2 border-slate-5 gap-y-md p-xs fixed inset-y-0 left-0 z-1000 flex w-60 flex-col border-r transition-[width,translate] duration-300 ease-in-out',
            isCollapsed && '-translate-x-full sm:w-20 sm:translate-x-0',
            className,
          )}
          {...props}
        >
          {children}
        </nav>

        <div
          className={cn(
            'fixed inset-0 bg-black/50 opacity-0 transition-opacity duration-300 ease-in-out sm:hidden',
            isCollapsed ? 'pointer-events-none' : 'opacity-100',
          )}
          onClick={toggleCollapsed}
        ></div>
      </>
    );
  },
);

Sidebar.displayName = 'Sidebar';

export default Sidebar;
