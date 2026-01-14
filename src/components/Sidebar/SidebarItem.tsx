import React from 'react';
import { NavLink, type NavLinkProps } from 'react-router';

import { cn } from '~/helpers/cn';

import { useSidebarContext } from './context';

type SidebarItemProps<T extends React.ElementType> = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  as: T;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as'>;

const SidebarItem = <T extends React.ElementType>({
  label,
  icon: Icon,
  as,
  className,
  ...props
}: SidebarItemProps<T>) => {
  const { isCollapsed } = useSidebarContext();

  const content = (
    <>
      <Icon className="text-slate-11 h-4 w-4" />
      <span className={cn(isCollapsed && 'text-center text-xs')}>{label}</span>
    </>
  );

  const baseStyles = cn(
    'flex rounded-xl transition-all duration-300 ease-in-out w-full',
    isCollapsed && 'sm:flex-col sm:items-center sm:justify-center sm:gap-y-2 sm:py-3',
    !isCollapsed && 'items-center gap-x-2 px-4 py-2',
  );

  const isNavLink = (as as unknown) === NavLink;
  if (isNavLink) {
    const navLinkProps = props as unknown as NavLinkProps;
    return (
      <NavLink
        {...navLinkProps}
        className={({ isActive }: { isActive: boolean }) =>
          cn(
            baseStyles,
            'hover:bg-slate-4 text-slate-12',
            isActive && 'bg-slate-5 text-slate-12 font-semibold',
            className,
          )
        }
      >
        {content}
      </NavLink>
    );
  }

  return React.createElement(
    as as React.ElementType,
    {
      ...props,
      className: cn(baseStyles, 'hover:bg-slate-4 text-slate-12', className),
    },
    content,
  );
};

SidebarItem.displayName = 'SidebarItem';

export default SidebarItem;
