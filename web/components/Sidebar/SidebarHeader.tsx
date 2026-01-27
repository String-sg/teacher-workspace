import { cn, Tooltip, TooltipContent, TooltipTrigger, Typography } from '@flow/core';
import { AnimatePresence, motion } from 'motion/react';
import React from 'react';

import { useSidebarContext } from './context';
import SidebarTrigger from './SidebarTrigger';

export type SidebarHeaderProps = React.ComponentPropsWithoutRef<'div'>;

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ className, ...props }) => {
  const { isOpen, isMobileOpen } = useSidebarContext();

  const isExpanded = isOpen || isMobileOpen;

  return (
    <div className={cn('relative flex items-center justify-end p-sm', className)} {...props}>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <Typography
            asChild
            variant="label-md-strong"
            className="absolute top-5 left-3 p-2xs whitespace-nowrap"
          >
            <motion.p
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{
                duration: 0.15,
                ease: [0.22, 0.61, 0.36, 1],
              }}
            >
              Teacher Workspace
            </motion.p>
          </Typography>
        )}
      </AnimatePresence>

      <Tooltip classNames={{ arrow: 'fill-transparent', content: 'bg-slate-12 z-10000' }}>
        <TooltipTrigger asChild>
          <SidebarTrigger />
        </TooltipTrigger>
        <TooltipContent side="right">
          <Typography variant="body-sm">
            {isExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
          </Typography>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default SidebarHeader;
