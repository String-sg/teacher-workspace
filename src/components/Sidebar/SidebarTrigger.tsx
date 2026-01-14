import { Button } from '@flow/core';
import React from 'react';

import { useSidebarContext } from './context';

export type SidebarTriggerProps = React.ComponentProps<typeof Button>;

const SidebarTrigger = React.forwardRef<HTMLButtonElement, SidebarTriggerProps>(
  ({ onClick, ...props }, ref) => {
    const { toggleCollapsed } = useSidebarContext();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      toggleCollapsed();
      onClick?.(event);
    };

    return <Button ref={ref} size="icon" variant="ghost" onClick={handleClick} {...props} />;
  },
);

SidebarTrigger.displayName = 'SidebarTrigger';

export default SidebarTrigger;
