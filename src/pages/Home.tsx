import { Typography } from '@flow/core';
import { Folder, Heart } from 'lucide-react';
import React from 'react';

import AppCard from '~/components/AppCard';
import { Book } from '~/icons';

interface AppCardData {
  id: number;
  name: string;
  description: string;
  icon: React.ComponentType;
  href: string;
  iconProps?: Record<string, string | number>;
  featured?: boolean;
  external?: boolean;
}

interface Section {
  title: string;
  apps: AppCardData[];
}

const AppSection = ({ title, apps, variant }: Section & { variant?: 'featured' | 'default' }) => (
  <div className="gap-md flex flex-col">
    <Typography variant="label-lg-strong">{title}</Typography>
    <div
      className={
        variant === 'featured' ? 'flex flex-col' : 'gap-sm grid grid-cols-6 lg:grid-cols-12'
      }
    >
      {apps.map(({ id, ...props }) => (
        <AppCard
          key={id}
          className={variant === 'featured' ? '' : 'col-span-3 lg:col-span-4'}
          variant={variant}
          {...props}
        />
      ))}
    </div>
  </div>
);

const Home = ({ name }: { name?: string }) => {
  const featuredApps = apps.filter((app) => app.featured);

  return (
    <div className="grid grid-cols-6 lg:grid-cols-12">
      <div className="col-span-6 lg:col-start-3 lg:col-end-11">
        {name && (
          <Typography variant="title-lg" className="mt-3 text-center lg:mt-20">
            Good afternoon, {name}
          </Typography>
        )}

        <div className="gap-2xl lg:gap-3xl mt-14 flex flex-col">
          {/* Featured */}
          {featuredApps.length > 0 && (
            <AppSection title="Featured" apps={featuredApps} variant="featured" />
          )}

          {/* Classroom and Parent Sections */}
          {sections.map(({ title, apps }) =>
            apps.length > 0 ? <AppSection key={title} title={title} apps={apps} /> : null,
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;

const apps: AppCardData[] = [
  {
    id: 1,
    name: 'App name 1',
    description: 'App description. Max two lines.',
    icon: Heart,
    iconProps: { stroke: 'var(--color-crimson-10)', fill: 'var(--color-crimson-10)', size: 32 },
    href: '/app/1',
    featured: true,
    external: true,
  },
  {
    id: 2,
    name: 'App name 2',
    description:
      'App description. Max two lines, for example this is a line where it will truncate if it goes longer.',
    icon: Folder,
    iconProps: { stroke: 'var(--color-blue-9)', fill: 'var(--color-blue-9)', size: 32 },
    href: '/app/2',
  },
  {
    id: 3,
    name: 'App name 3',
    description:
      'App description. Max two lines, for example this is a line where it will truncate if it goes longer.',
    icon: Folder,
    iconProps: { stroke: 'var(--color-blue-9)', fill: 'var(--color-blue-9)', size: 32 },
    href: '/app/3',
  },
  {
    id: 4,
    name: 'App name 4',
    description:
      'App description. Max two lines, for example this is a line where it will truncate if it goes longer.',
    icon: Book,
    href: '/app/4',
  },
  {
    id: 5,
    name: 'App name 5',
    description:
      'App description. Max two lines, for example this is a line where it will truncate if it goes longer.',
    icon: Heart,
    iconProps: { stroke: 'var(--color-crimson-10)', fill: 'var(--color-crimson-10)', size: 32 },
    href: '/app/5',
  },
];

const sections: Section[] = [
  {
    title: 'Classroom and Student',
    apps: apps,
  },
  {
    title: 'Parent and Communication',
    apps: apps.slice(2),
  },
];
