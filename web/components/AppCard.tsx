import { type LucideIcon } from 'lucide-react';
import React from 'react';
import { Link, type LinkProps } from 'react-router';

import { cn } from '~/lib/utils';

interface AppCardBaseProps {
  /**
   * The icon to display in the card.
   */
  icon: LucideIcon;
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
    'flex cursor-pointer rounded-3xl border border-border p-4 outline-offset-0 transition-[background-color,outline]',
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden',
    'hover:bg-accent active:bg-accent/80',
    direction === 'vertical'
      ? 'flex-col items-start gap-4 bg-card'
      : 'flex-row items-center gap-6 bg-muted',
    className,
  );

  const cardContent = (
    <>
      <div className="rounded-2xl border border-border bg-card p-6">
        <Icon />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
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
