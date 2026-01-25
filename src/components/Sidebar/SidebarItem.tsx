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
import React, { useCallback } from 'react';
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
   * The kind of element to render.
   */
  kind: 'anchor';
  /**
   * An external link to navigate to.
   */
  href: string;
}

interface SidebarItemLinkProps extends SidebarItemBaseProps, Omit<LinkProps, 'to' | 'children'> {
  /**
   * The kind of element to render.
   */
  kind: 'link';
  /**
   * An internal link to navigate to.
   */
  to: string;
}

interface SidebarItemButtonProps
  extends SidebarItemBaseProps, Omit<ButtonProps, 'variant' | 'size' | 'children'> {
  /**
   * The kind of element to render.
   */
  kind: 'button';
  /**
   * A callback to be called when the item is clicked.
   */
  onClick: React.MouseEventHandler<HTMLButtonElement>;
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

  const { kind, onPointerMove } = props;

  // A workaround to prevent the tooltip from being shown when the sidebar is open.
  const handleAnchorPointerMove: React.PointerEventHandler<HTMLAnchorElement> = useCallback(
    (event) => {
      if (isOpen) {
        event.preventDefault();
      }

      if (kind !== 'button') {
        onPointerMove?.(event);
      }
    },
    [isOpen, kind, onPointerMove],
  );

  // A workaround to prevent the tooltip from being shown when the sidebar is open.
  const handleButtonPointerMove: React.PointerEventHandler<HTMLButtonElement> = useCallback(
    (event) => {
      if (isOpen) {
        event.preventDefault();
      }

      if (kind === 'button') {
        onPointerMove?.(event);
      }
    },
    [isOpen, kind, onPointerMove],
  );

  const itemClassName = cn(
    'flex cursor-pointer justify-start gap-x-xs rounded-lg p-sm hover:bg-slate-4 active:bg-slate-5 active:opacity-100',
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

  if (props.kind === 'anchor') {
    const { kind: _kind, ...anchorProps } = props;
    return (
      <Tooltip classNames={{ arrow: 'fill-transparent', content: 'bg-slate-12 z-10000' }}>
        <TooltipTrigger asChild>
          <a
            {...anchorProps}
            className={itemClassName}
            data-selected={!!selected}
            onPointerMove={handleAnchorPointerMove}
          >
            {itemContent}
          </a>
        </TooltipTrigger>

        {tooltipContent}
      </Tooltip>
    );
  }

  if (props.kind === 'link') {
    const { kind: _kind, ...linkProps } = props;
    return (
      <Tooltip classNames={{ arrow: 'fill-transparent', content: 'bg-slate-12 z-10000' }}>
        <TooltipTrigger asChild>
          <Link
            {...linkProps}
            className={itemClassName}
            data-selected={!!selected}
            onPointerMove={handleAnchorPointerMove}
          >
            {itemContent}
          </Link>
        </TooltipTrigger>

        {tooltipContent}
      </Tooltip>
    );
  }

  const { kind: _kind, ...buttonProps } = props;
  return (
    <Tooltip classNames={{ arrow: 'fill-transparent', content: 'bg-slate-12 z-10000' }}>
      <TooltipTrigger asChild>
        <Button
          {...buttonProps}
          variant="ghost"
          size="sm"
          className={itemClassName}
          onPointerMove={handleButtonPointerMove}
          data-selected={!!selected}
        >
          {itemContent}
        </Button>
      </TooltipTrigger>

      {tooltipContent}
    </Tooltip>
  );
};

export default SidebarItem;
