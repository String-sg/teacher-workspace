import { Typography } from '@flow/core';
import React from 'react';

interface AppCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  variant?: 'featured' | 'default';
  onClick?: () => void;
  className?: string;
}

// TODO: missing hover and clicked styling (to request from UXD)

const AppCard = ({
  name,
  description,
  icon,
  variant = 'default',
  onClick,
  className,
}: AppCardProps) => {
  const variantStyles =
    variant === 'featured'
      ? 'border-slate-7 bg-slate-2 items-center'
      : 'border-slate-6 bg-white-default flex-col';

  const interactiveStyles = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`gap-lg p-md flex rounded-3xl border ${variantStyles} ${interactiveStyles} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="p-lg border-slate-6 bg-white-default w-fit rounded-2xl border">{icon}</div>

      <div className="gap-xs flex flex-col">
        <Typography variant="label-md-strong" className="text-olive-12">
          {name}
        </Typography>
        <Typography variant="body-sm" className="text-olive-11 line-clamp-2">
          {description}
        </Typography>
      </div>
    </div>
  );
};

export default AppCard;
