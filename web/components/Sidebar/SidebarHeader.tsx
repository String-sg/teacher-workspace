import { AnimatePresence, motion } from 'motion/react';
import React from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui';
import { cn } from '~/lib/utils';

import { useSidebarContext } from './context';
import SidebarTrigger from './SidebarTrigger';

export type SidebarHeaderProps = React.ComponentPropsWithoutRef<'div'>;

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ className, ...props }) => {
  const { isOpen, isMobileOpen, isMobile } = useSidebarContext();

  const isExpanded = isOpen || (isMobile && isMobileOpen);

  return (
    <div className={cn('relative flex items-center justify-end p-2', className)} {...props}>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.span
            className="absolute top-5 left-3 p-1 text-sm font-semibold whitespace-nowrap"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{
              duration: 0.15,
              ease: [0.22, 0.61, 0.36, 1],
            }}
          >
            Teacher Workspace
          </motion.span>
        )}
      </AnimatePresence>

      <Tooltip>
        <TooltipTrigger render={<SidebarTrigger />} />
        <TooltipContent side="right" sideOffset={4} className="z-50">
          {isExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default SidebarHeader;
