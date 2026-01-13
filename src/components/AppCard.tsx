import { cn, Typography } from '@flow/core';
import React from 'react';
import { Link } from 'react-router';

interface AppCardProps {
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType;
  iconProps?: Record<string, string | number>;
  variant?: 'featured' | 'default';
  className?: string;
  external?: boolean;
}

const AppCard = ({
  name,
  description,
  icon: Icon,
  iconProps,
  variant = 'default',
  href,
  external = false,
  className,
}: AppCardProps) => {
  const variantStyles =
    variant === 'featured'
      ? 'bg-slate-2 items-center active:bg-slate-5'
      : 'bg-white-default flex-col active:bg-slate-6';

  const baseClassName = cn(
    'gap-lg p-md flex rounded-3xl border cursor-pointer hover:bg-slate-4 focus:bg-slate-4 border-slate-6',
    variantStyles,
    className,
  );

  const content = (
    <>
      <div className="w-fit rounded-2xl border border-slate-6 bg-white-default p-lg">
        <Icon {...iconProps} />
      </div>

      <div className="flex flex-col gap-xs">
        <Typography variant="label-md-strong" className="text-olive-12">
          {name}
        </Typography>
        <Typography variant="body-sm" className="line-clamp-2 text-olive-11">
          {description}
        </Typography>
      </div>
    </>
  );

  if (external) {
    return (
      <a href={href} className={baseClassName} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link to={href} className={baseClassName}>
      {content}
    </Link>
  );
};

export default AppCard;
