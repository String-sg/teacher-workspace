import { Button } from '@flow/core';
import React from 'react';

import { useSidebarContext } from './context';

export type SidebarTriggerProps = React.ComponentPropsWithoutRef<'button'>;

const SidebarTrigger = React.forwardRef<HTMLButtonElement, SidebarTriggerProps>((props, ref) => {
  const { toggleCollapsed } = useSidebarContext();

  return (
    // <button
    //   ref={ref}
    //   className={cn('flex items-center justify-center', className)}
    //   onClick={toggleCollapsed}
    //   {...props}
    // >
    //   Sidebar Trigger
    // </button>
    <>
      <Button variant="link" ref={ref} onClick={toggleCollapsed} {...props}>
        Sidebar Trigger
      </Button>
      <Button variant="default" ref={ref} onClick={toggleCollapsed} {...props}>
        Sidebar Trigger
      </Button>
      <Button variant="accent" ref={ref} onClick={toggleCollapsed} {...props}>
        Sidebar Trigger
      </Button>
      <Button variant="critical" ref={ref} onClick={toggleCollapsed} {...props}>
        Sidebar Trigger
      </Button>
      <Button variant="outline" ref={ref} onClick={toggleCollapsed} {...props}>
        Sidebar Trigger
      </Button>
      <Button variant="neutral" ref={ref} onClick={toggleCollapsed} {...props}>
        Sidebar Trigger
      </Button>
      <Button variant="ghost" ref={ref} onClick={toggleCollapsed} {...props}>
        Sidebar Trigger
      </Button>
    </>
  );
});

SidebarTrigger.displayName = 'SidebarTrigger';

export default SidebarTrigger;
