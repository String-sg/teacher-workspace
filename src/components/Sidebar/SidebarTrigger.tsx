import React from 'react';

import { cn } from '~/helpers/cn';

import { useSidebarContext } from './context';

export type SidebarTriggerProps = React.ComponentPropsWithoutRef<'button'>;

const SidebarTrigger = React.forwardRef<HTMLButtonElement, SidebarTriggerProps>(
  ({ className, ...props }, ref) => {
    const { toggleCollapsed } = useSidebarContext();

    return (
      <button
        ref={ref}
        type="button"
        onClick={toggleCollapsed}
        className={cn(
          'hover:bg-slate-4 flex items-center justify-center rounded-lg p-2 transition-colors duration-300 ease-in-out',
          className,
        )}
        {...props}
      >
        {props.children}
      </button>
    );
  },
);

SidebarTrigger.displayName = 'SidebarTrigger';

export default SidebarTrigger;
