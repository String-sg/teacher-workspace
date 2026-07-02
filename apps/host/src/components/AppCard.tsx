import React from 'react';
import { Link } from 'react-router';

import { cn } from '~/helpers/cn';

export interface AppCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: 'pink' | 'blue' | 'orange' | 'green' | 'purple';
  href: string;
  badge?: string;
}

const CARD_BASE =
  'tw:group tw:flex tw:rounded-[14px] tw:border tw:bg-background tw:p-4 tw:transition-colors tw:hover:bg-muted/50';

const HOVER_COLOR_MAP: Record<AppCard['color'], string> = {
  pink: 'tw:group-hover:text-pink-500',
  blue: 'tw:group-hover:text-blue-600',
  orange: 'tw:group-hover:text-orange-500',
  green: 'tw:group-hover:text-green-500',
  purple: 'tw:group-hover:text-purple-500',
};

function CardIcon({
  icon,
  color,
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'> & {
  icon: string;
  color: AppCard['color'];
}) {
  return (
    <div
      className={cn(
        'tw:relative tw:flex tw:size-16 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-[14px] tw:border tw:bg-white tw:p-2',
        className,
      )}
      {...props}
    >
      <img src={icon} alt="" className="tw:h-full tw:w-full tw:object-contain" />
      <div
        className={cn(
          'tw:pointer-events-none tw:absolute tw:inset-0 tw:bg-[#0064ff] tw:mix-blend-color tw:transition-opacity tw:duration-200 tw:will-change-[opacity] tw:group-hover:opacity-0',
          HOVER_COLOR_MAP[color],
        )}
      />
    </div>
  );
}

type AppCardProps = Pick<AppCard, 'title' | 'description' | 'icon' | 'color' | 'href' | 'badge'> & {
  isFeatured?: boolean;
};

export function AppCard({
  title,
  description,
  icon,
  color,
  href,
  badge,
  isFeatured,
}: AppCardProps) {
  const className = cn(
    CARD_BASE,
    'tw:flex-col tw:gap-4',
    isFeatured && 'tw:border-[#C8C8C8] tw:bg-white tw:sm:flex-row tw:sm:items-center',
  );

  const content = (
    <>
      <CardIcon icon={icon} color={color} />
      <div className={cn('tw:flex tw:flex-col tw:gap-2')}>
        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
          <h3 className="tw:font-semibold tw:text-foreground">{title}</h3>
          {badge && (
            <span className="tw:rounded-full tw:bg-blue-100 tw:px-2 tw:py-0.5 tw:text-xs tw:font-medium tw:text-blue-700">
              {badge}
            </span>
          )}
        </div>
        <p className="tw:line-clamp-3 tw:text-sm tw:text-muted-foreground">{description}</p>
      </div>
    </>
  );

  if (href.startsWith('http')) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link to={href} className={className}>
      {content}
    </Link>
  );
}
