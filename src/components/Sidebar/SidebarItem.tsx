import { Button, cn, Tooltip, TooltipContent, TooltipTrigger, Typography } from '@flow/core';
import { type Icon as FlowIcon } from '@flow/icons';
import { AnimatePresence, motion } from 'motion/react';
import React, { useCallback } from 'react';
import { Link } from 'react-router';

import { useSidebarContext } from './context';

interface BaseSidebarItemProps {
  /**
   * The icon to display in the sidebar item.
   */
  icon: FlowIcon;
  /**
   * The label to display in the sidebar item.
   */
  label: string;
  /**
   * The tooltip to display when the item is hovered on mobile.
   */
  tooltip: string;
  /**
   * Whether the item is selected.
   */
  selected?: boolean;
}

interface AnchorSidebarItemProps extends BaseSidebarItemProps {
  /**
   * If provided, it will render the item as an anchor.
   */
  href: string;
  to?: never;
  onClick?: never;
}

interface LinkSidebarItemProps extends BaseSidebarItemProps {
  href?: never;
  /**
   * If provided, it will render the item as a `Link`.
   */
  to: string;
  onClick?: never;
}

interface ButtonSidebarItemProps extends BaseSidebarItemProps {
  href?: never;
  to?: never;
  /**
   * If provided, it will render the item as a button.
   */
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}

export type SidebarItemProps =
  | AnchorSidebarItemProps
  | LinkSidebarItemProps
  | ButtonSidebarItemProps;

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  tooltip,
  selected,
  href,
  to,
  onClick,
}) => {
  const { isOpen, isMobileOpen } = useSidebarContext();

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    (event) => {
      onClick?.(event);
    },
    [onClick],
  );

  // A workaround to prevent the tooltip from being shown when the sidebar is open.
  const handlePointerMove: React.PointerEventHandler<HTMLButtonElement> = useCallback(
    (event) => {
      if (!isOpen) {
        return;
      }

      event.preventDefault();
    },
    [isOpen],
  );

  const content = (
    <>
      <Icon className="flex h-4 w-4 shrink-0 text-slate-11" />

      <AnimatePresence initial={false}>
        {(isOpen || isMobileOpen) && (
          <Typography asChild variant="label-md" className="text-slate-12">
            <motion.p
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{
                duration: 0.15,
                ease: [0.22, 0.61, 0.36, 1],
              }}
            >
              {label}
            </motion.p>
          </Typography>
        )}
      </AnimatePresence>
    </>
  );

  return (
    <Tooltip classNames={{ arrow: 'fill-transparent', content: 'bg-slate-12 z-10000' }}>
      <TooltipTrigger asChild onPointerMove={handlePointerMove}>
        <Button
          asChild={!!href || !!to}
          variant="ghost"
          size="sm"
          className={cn(
            'flex cursor-pointer justify-start gap-x-xs rounded-lg p-sm hover:bg-slate-4 active:bg-slate-5 active:opacity-100',
            'data-[selected=true]:bg-slate-5 data-[selected=true]:hover:bg-slate-5',
          )}
          onClick={handleClick}
          data-selected={selected}
        >
          {href ? <a href={href}>{content}</a> : to ? <Link to={to}>{content}</Link> : content}
        </Button>
      </TooltipTrigger>

      <TooltipContent side="right">
        <Typography variant="body-sm">{tooltip}</Typography>
      </TooltipContent>
    </Tooltip>
  );
};

export default SidebarItem;
