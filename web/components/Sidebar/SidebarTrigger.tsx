import { PanelLeft } from 'lucide-react';
import React from 'react';

import { Button } from '~/components/ui';
import { cn } from '~/lib/utils';

import { useSidebarContext } from './context';

export type SidebarTriggerProps = React.ComponentPropsWithoutRef<'button'>;

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
      className={cn('hover:bg-accent active:bg-accent/80', className)}
      onClick={handleClick}
      {...props}
    >
      <PanelLeft className="h-4 w-4 text-muted-foreground" />
    </Button>
  );
};

export default SidebarTrigger;
