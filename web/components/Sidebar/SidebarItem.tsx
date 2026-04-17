import { type LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React from 'react';
import { Link, type LinkProps } from 'react-router';

import { Button, Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui';
import { cn } from '~/lib/utils';

import { useSidebarContext } from './context';

interface SidebarItemBaseProps {
  /**
   * The icon to display in the sidebar item.
   */
  icon: LucideIcon;
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
  extends SidebarItemBaseProps, Omit<React.ComponentPropsWithoutRef<'button'>, 'children'> {
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
  const { isOpen, isMobileOpen, isMobile } = useSidebarContext();

  const isExpanded = isOpen || (isMobile && isMobileOpen);

  const handlePointerMove = <T extends HTMLElement>(
    event: React.PointerEvent<T>,
    handler?: React.PointerEventHandler<T>,
  ) => {
    if (isExpanded) {
      event.preventDefault();
      return;
    }

    handler?.(event);
  };

  const itemClassName = cn(
    'flex cursor-pointer justify-start gap-x-1.5 rounded-lg p-2 outline-offset-0 transition-[background-color,outline]',
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
    'hover:bg-accent active:bg-accent/80 active:opacity-100',
    'data-[selected=true]:bg-accent data-[selected=true]:hover:bg-accent',
    props.className,
  );

  const itemContent = (
    <>
      <Icon className="flex h-4 w-4 shrink-0 text-muted-foreground" />

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.span
            className="text-sm font-medium text-foreground"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{
              duration: 0.15,
              ease: [0.22, 0.61, 0.36, 1],
            }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </>
  );

  const tooltipContent = (
    <TooltipContent side="right" sideOffset={4} className="z-50">
      {tooltip}
    </TooltipContent>
  );

  if ('href' in props && props.href !== undefined) {
    const { onPointerMove, className: _className, ...anchorProps } = props;

    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <a
              className={itemClassName}
              target="_blank"
              rel="noopener noreferrer"
              data-selected={!!selected}
              onPointerMove={(event) => handlePointerMove(event, onPointerMove)}
              {...anchorProps}
            />
          }
        >
          {itemContent}
        </TooltipTrigger>
        {tooltipContent}
      </Tooltip>
    );
  }

  if ('to' in props && props.to !== undefined) {
    const { onPointerMove, className: _className, ...linkProps } = props;

    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              className={itemClassName}
              data-selected={!!selected}
              onPointerMove={(event) => handlePointerMove(event, onPointerMove)}
              {...linkProps}
            />
          }
        >
          {itemContent}
        </TooltipTrigger>
        {tooltipContent}
      </Tooltip>
    );
  }

  const { onPointerMove, className: _className, ...buttonProps } = props;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={itemClassName}
            onPointerMove={(event) => handlePointerMove(event, onPointerMove)}
            data-selected={!!selected}
            {...buttonProps}
          />
        }
      >
        {itemContent}
      </TooltipTrigger>
      {tooltipContent}
    </Tooltip>
  );
};

export default SidebarItem;
