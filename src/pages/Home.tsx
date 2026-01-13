import { Typography } from '@flow/core';
import React from 'react';

import AppCard from '@/components/AppCard';
import { Book, Folder, Heart } from '@/icons';

const AppSection = ({ title, apps }: Section) => (
  <div className="gap-md flex flex-col">
    <Typography variant="label-lg-strong">{title}</Typography>
    <div className="gap-sm grid grid-cols-6 lg:grid-cols-12">
      {apps.map(({ id, name, icon, description }) => (
        <AppCard
          key={id}
          className="col-span-3 lg:col-span-4"
          icon={icon}
          name={name}
          description={description}
          onClick={() => console.log('clicked', name)}
        />
      ))}
    </div>
  </div>
);

const Home = () => {
  return (
    <div className="grid grid-cols-6 lg:grid-cols-12">
      <div className="col-span-6 lg:col-start-3 lg:col-end-11">
        <Typography variant="title-lg" className="mt-3 mb-14 text-center lg:mt-20">
          Good afternoon, Cher
        </Typography>

        <div className="gap-2xl lg:gap-3xl flex flex-col">
          {/* Featured */}
          <div className="gap-md flex flex-col">
            <Typography variant="label-lg-strong">Featured</Typography>
            <AppCard
              icon={apps[0].icon}
              name={apps[0].name}
              description={apps[0].description}
              variant="featured"
            />
          </div>

          {/* Classroom and Parent Sections */}
          {sections.map(({ title, apps }) => (
            <AppSection key={title} title={title} apps={apps} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;

interface AppCardData {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface Section {
  title: string;
  apps: AppCardData[];
}

const apps: AppCardData[] = [
  {
    id: 1,
    name: 'App name 1',
    description: 'App description. Max two lines.',
    icon: <Heart />,
  },
  {
    id: 2,
    name: 'App name 2',
    description:
      'App description. Max two lines, for example this is a line where it will truncate if it goes longer.',
    icon: <Book />,
  },
  {
    id: 3,
    name: 'App name 3',
    description:
      'App description. Max two lines, for example this is a line where it will truncate if it goes longer.',
    icon: <Folder />,
  },
  {
    id: 4,
    name: 'App name 4',
    description:
      'App description. Max two lines, for example this is a line where it will truncate if it goes longer.',
    icon: <Book />,
  },
  {
    id: 5,
    name: 'App name 5',
    description:
      'App description. Max two lines, for example this is a line where it will truncate if it goes longer.',
    icon: <Book />,
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
