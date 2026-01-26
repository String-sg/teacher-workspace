import {
  Button,
  type ButtonProps,
  cn,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Typography,
} from '@flow/core';
import { type Icon as FlowIcon } from '@flow/icons';
import { AnimatePresence, motion } from 'motion/react';
import React from 'react';
import { Link, type LinkProps } from 'react-router';

import { useSidebarContext } from './context';

interface SidebarItemBaseProps {
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

interface SidebarItemAnchorProps
  extends
    SidebarItemBaseProps,
    Omit<React.ComponentPropsWithoutRef<'a'>, 'title' | 'href' | 'children'> {
  /**
   * If provided, the item will be rendered as an anchor element.
   */
  href: string;
  to?: never;
}

interface SidebarItemLinkProps extends SidebarItemBaseProps, Omit<LinkProps, 'to' | 'children'> {
  /**
   * If provided, the item will be rendered as a link element.
   */
  to: string;
  href?: never;
}

interface SidebarItemButtonProps
  extends SidebarItemBaseProps, Omit<ButtonProps, 'variant' | 'size' | 'children'> {
  /**
   * If provided without `href` or `to`, the item will be rendered as a button element.
   */
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  href?: never;
  to?: never;
}

export type SidebarItemProps =
  | SidebarItemAnchorProps
  | SidebarItemLinkProps
  | SidebarItemButtonProps;

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  tooltip,
  selected,
  ...props
}) => {
  const { isOpen, isMobileOpen } = useSidebarContext();

  // A workaround to prevent the tooltip from being shown when the sidebar is open.
  const handlePointerMove = <T extends HTMLElement>(
    event: React.PointerEvent<T>,
    handler?: React.PointerEventHandler<T>,
  ) => {
    if (isOpen) {
      event.preventDefault();
      return;
    }

    handler?.(event);
  };

  const itemClassName = cn(
    'flex cursor-pointer justify-start gap-x-xs rounded-lg p-sm focus-standard outline-offset-0 transition-[background-color,outline] hover:bg-slate-4 active:bg-slate-5 active:opacity-100',
    'data-[selected=true]:bg-slate-5 data-[selected=true]:hover:bg-slate-5',
    props.className,
  );

  const itemContent = (
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

  const tooltipContent = (
    <TooltipContent side="right">
      <Typography variant="body-sm">{tooltip}</Typography>
    </TooltipContent>
  );

  if ('href' in props && props.href !== undefined) {
    const { href, onPointerMove, ...anchorProps } = props;
    return (
      <Tooltip classNames={{ arrow: 'fill-transparent', content: 'bg-slate-12 z-10000' }}>
        <TooltipTrigger asChild>
          <a
            href={href}
            className={itemClassName}
            target="_blank"
            rel="noopener noreferrer"
            data-selected={!!selected}
            onPointerMove={(event) => handlePointerMove(event, onPointerMove)}
            {...anchorProps}
          >
            {itemContent}
          </a>
        </TooltipTrigger>

        {tooltipContent}
      </Tooltip>
    );
  }

  if ('to' in props && props.to !== undefined) {
    const { to, onPointerMove, ...linkProps } = props;
    return (
      <Tooltip classNames={{ arrow: 'fill-transparent', content: 'bg-slate-12 z-10000' }}>
        <TooltipTrigger asChild>
          <Link
            to={to}
            className={itemClassName}
            data-selected={!!selected}
            onPointerMove={(event) => handlePointerMove(event, onPointerMove)}
            {...linkProps}
          >
            {itemContent}
          </Link>
        </TooltipTrigger>

        {tooltipContent}
      </Tooltip>
    );
  }

  const { onPointerMove, ...buttonProps } = props;
  return (
    <Tooltip classNames={{ arrow: 'fill-transparent', content: 'bg-slate-12 z-10000' }}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={itemClassName}
          onPointerMove={(event) => handlePointerMove(event, onPointerMove)}
          data-selected={!!selected}
          {...buttonProps}
        >
          {itemContent}
        </Button>
      </TooltipTrigger>

      {tooltipContent}
    </Tooltip>
  );
};

export default SidebarItem;
