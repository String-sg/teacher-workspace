import React from 'react';

import { cn } from '~/helpers/cn';

import { useSidebarContext } from './context';

export type SidebarHeaderProps = {
  icon?: React.ComponentType<{ className?: string }>;
} & React.ComponentPropsWithoutRef<'div'>;

const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ icon: Icon, className, ...props }, ref) => {
    const { isCollapsed, toggleCollapsed } = useSidebarContext();

    return (
      <div
        ref={ref}
        {...props}
        className={cn(
          'text-md flex items-center font-semibold',
          isCollapsed && 'justify-center p-2',
          !isCollapsed && 'justify-between py-3 pl-1',
          className,
        )}
      >
        <span
          className={cn(
            'overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out',
            isCollapsed ? 'max-w-0 opacity-0' : 'max-w-full opacity-100',
          )}
        >
          Teacher Workspace
        </span>
        {Icon && (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hover:bg-slate-4 flex-shrink-0 cursor-pointer rounded-lg p-2 transition-colors duration-300 ease-in-out"
          >
            <Icon className="text-slate-11 h-4 w-4" />
          </button>
        )}
      </div>
    );
  },
);

SidebarHeader.displayName = 'SidebarHeader';

export default SidebarHeader;
