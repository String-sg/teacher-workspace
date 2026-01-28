import { cn, Typography } from '@flow/core';
import { type Icon as FlowIcon } from '@flow/icons';
import React from 'react';
import { Link, type LinkProps } from 'react-router';

interface AppCardBaseProps {
  /**
   * The icon to display in the card.
   */
  icon: FlowIcon;
  /**
   * The title to display in the card.
   */
  title: string;
  /**
   * The description to display in the card.
   */
  description: string;
  /**
   * The direction to display the card.
   */
  direction?: 'vertical' | 'horizontal';
}

interface AppCardAsAnchorProps
  extends
    AppCardBaseProps,
    Omit<React.ComponentPropsWithoutRef<'a'>, 'title' | 'href' | 'children'> {
  /**
   * If provided, the card will be rendered as an anchor element.
   */
  href: string;
  to?: never;
}

interface AppCardAsLinkProps
  extends AppCardBaseProps, Omit<LinkProps, 'title' | 'to' | 'children'> {
  href?: never;
  /**
   * If provided, the card will be rendered as a link element.
   */
  to: string;
}

interface AppCardAsDivProps
  extends AppCardBaseProps, Omit<React.ComponentPropsWithoutRef<'div'>, 'title' | 'children'> {
  href?: never;
  to?: never;
}

export type AppCardProps = AppCardAsAnchorProps | AppCardAsLinkProps | AppCardAsDivProps;

const AppCard: React.FC<AppCardProps> = ({
  icon: Icon,
  title,
  description,
  direction = 'vertical',
  className,
  ...props
}) => {
  const cardClassName = cn(
    'flex cursor-pointer rounded-3xl border border-slate-6 p-md focus-standard outline-offset-0 transition-[background-color,outline] hover:bg-slate-4 active:bg-slate-5',
    direction === 'vertical'
      ? 'flex-col items-start gap-md bg-white-default'
      : 'flex-row items-center gap-lg bg-slate-2',
    className,
  );

  const cardContent = (
    <>
      <div className="rounded-2xl border border-slate-6 bg-white-default p-lg">
        <Icon />
      </div>

      <div className="flex flex-col gap-xs">
        <Typography variant="label-md-strong" className="text-olive-12">
          {title}
        </Typography>
        <Typography variant="body-sm" className="line-clamp-2 text-olive-11">
          {description}
        </Typography>
      </div>
    </>
  );

  if ('href' in props && props.href !== undefined) {
    return (
      <a target="_blank" rel="noopener noreferrer" className={cardClassName} {...props}>
        {cardContent}
      </a>
    );
  }

  if ('to' in props && props.to !== undefined) {
    return (
      <Link className={cardClassName} {...props}>
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={cardClassName} {...props}>
      {cardContent}
    </div>
  );
};

export default AppCard;
