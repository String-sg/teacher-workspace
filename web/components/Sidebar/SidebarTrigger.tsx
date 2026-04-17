import { Button, type ButtonProps, cn } from '@flow/core';
import { PanelLeft } from '@flow/icons';
import React from 'react';

import { useSidebarContext } from './context';

export type SidebarTriggerProps = Omit<ButtonProps, 'children'>;

const SidebarTrigger: React.FC<SidebarTriggerProps> = ({ className, onClick, ...props }) => {
  const { toggleSidebar } = useSidebarContext();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    toggleSidebar();
    onClick?.(event);
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      // `size="icon"` alone renders at icon dimensions with no clickable pad —
      // enforce a proper hit area so the hover background is visible and the
      // tap target meets the ~40px guideline.
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-4 active:bg-slate-5 active:opacity-100',
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      <PanelLeft className="h-4 w-4 text-slate-11" />
    </Button>
  );
};

export default SidebarTrigger;
