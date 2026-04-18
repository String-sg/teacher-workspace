import { cn, Tooltip, TooltipContent, TooltipTrigger, Typography } from '@flow/core';
import { AnimatePresence, motion } from 'motion/react';
import React from 'react';

import { SIDEBAR_TOOLTIP_CLASSNAMES } from './constants';
import { useSidebarContext } from './context';
import SidebarTrigger from './SidebarTrigger';

export type SidebarHeaderProps = React.ComponentPropsWithoutRef<'div'>;

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ className, ...props }) => {
  const { isOpen, isMobileOpen, isMobile } = useSidebarContext();

  const isExpanded = isOpen || (isMobile && isMobileOpen);

  return (
    <div
      className={cn(
        'flex items-center p-3',
        // Expanded: label on the left, toggle pinned to the right.
        // Collapsed: toggle is the only child — center it on the 64px rail
        // so it aligns with the nav icons below.
        isExpanded ? 'justify-between' : 'justify-center',
        className,
      )}
      {...props}
    >
      <AnimatePresence initial={false}>
        {isExpanded && (
          <Typography asChild variant="label-md-strong" className="whitespace-nowrap">
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

      <Tooltip classNames={SIDEBAR_TOOLTIP_CLASSNAMES}>
        <TooltipTrigger asChild>
          <SidebarTrigger />
        </TooltipTrigger>
        <TooltipContent showArrow={false} side="right" sideOffset={4}>
          <Typography variant="body-sm">
            {isExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
          </Typography>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default SidebarHeader;
