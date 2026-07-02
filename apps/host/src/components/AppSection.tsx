import React from 'react';

import { cn } from '~/helpers/cn';

export interface AppSectionProps extends React.PropsWithChildren {
  title: string;
  description?: string;
  isFeatured?: boolean;
}

export function AppSection({ title, description, isFeatured, children }: AppSectionProps) {
  return (
    <section className="tw:flex tw:flex-col tw:gap-4">
      <div className="tw:flex tw:flex-col tw:gap-1">
        <h2 className="tw:text-lg tw:font-semibold tw:text-foreground">{title}</h2>
        {description && <p className="tw:text-sm tw:text-muted-foreground">{description}</p>}
      </div>
      <div className={cn('tw:grid tw:grid-cols-1 tw:gap-4', !isFeatured && 'tw:sm:grid-cols-3')}>
        {children}
      </div>
    </section>
  );
}
