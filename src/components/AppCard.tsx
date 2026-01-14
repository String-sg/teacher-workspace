import { Typography } from '@flow/core';
import React from 'react';
import { Link } from 'react-router';

import { cn } from '@/helpers/cn';

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

// TODO: missing hover and clicked styling (to request from UXD)

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
      ? 'border-slate-7 bg-slate-2 items-center'
      : 'border-slate-6 bg-white-default flex-col';

  const baseClassName = cn(
    'gap-lg p-md flex rounded-3xl border cursor-pointer',
    variantStyles,
    className,
  );

  const content = (
    <>
      <div className="p-lg border-slate-6 bg-white-default w-fit rounded-2xl border">
        <Icon {...iconProps} />
      </div>

      <div className="gap-xs flex flex-col">
        <Typography variant="label-md-strong" className="text-olive-12">
          {name}
        </Typography>
        <Typography variant="body-sm" className="text-olive-11 line-clamp-2">
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
