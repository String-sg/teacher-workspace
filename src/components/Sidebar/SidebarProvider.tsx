import React, { useCallback, useState } from 'react';

import { cn } from '~/helpers/cn';

import { SidebarContext } from './context';

export type SidebarProviderProps = React.ComponentPropsWithoutRef<'div'>;

const SidebarProvider = React.forwardRef<HTMLDivElement, SidebarProviderProps>(
  ({ children, className, ...props }, ref) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleCollapsed = useCallback(() => setIsCollapsed((prev) => !prev), []);

    return (
      <SidebarContext.Provider value={{ isCollapsed, toggleCollapsed }}>
        <div
          ref={ref}
          className={cn(
            'transition-[padding] ease-linear sm:pl-60',
            isCollapsed && 'sm:pl-20',
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    );
  },
);

SidebarProvider.displayName = 'SidebarProvider';

export default SidebarProvider;
