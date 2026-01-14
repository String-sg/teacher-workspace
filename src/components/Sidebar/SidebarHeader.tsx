import { Button } from '@flow/core';
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
          isCollapsed && 'p-xs justify-center',
          !isCollapsed && 'py-sm pl-2xs justify-between',
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
          <Button size="icon" variant="ghost" onClick={toggleCollapsed}>
            <Icon className="text-slate-11 h-4 w-4" />
          </Button>
        )}
      </div>
    );
  },
);

SidebarHeader.displayName = 'SidebarHeader';

export default SidebarHeader;
