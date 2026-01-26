import { Typography } from '@flow/core';
import { Heart } from '@flow/icons';
import React from 'react';

import AppCard from '~/components/AppCard';
import { getDayPeriod } from '~/helpers/dateTime';

const HomeView: React.FC = () => {
  const dayPeriod = getDayPeriod();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-14 px-md pt-3xl pb-3xl sm:pt-20">
      <Typography variant="title-lg" className="p-sm text-center">
        Good {dayPeriod}
      </Typography>

      <div className="flex flex-col gap-3xl">
        <div className="flex flex-col gap-md">
          <Typography variant="label-lg-strong">Featured</Typography>

          <AppCard
            icon={Heart}
            title="App name"
            description="App description. Max two lines, for example this is a line where it will truncate if it goes longer."
            direction="horizontal"
            href="https://transform.gov.sg"
          />
        </div>

        <div className="flex flex-col gap-md">
          <Typography variant="label-lg-strong">Classroom and Student</Typography>

          <div className="grid grid-cols-2 gap-md md:grid-cols-3">
            <AppCard
              icon={Heart}
              title="App name"
              description="App description. Max two lines, for example this is a line where it will truncate if it goes longer."
              href="https://transform.gov.sg"
            />
            <AppCard
              icon={Heart}
              title="App name"
              description="App description. Max two lines, for example this is a line where it will truncate if it goes longer."
              href="https://transform.gov.sg"
            />
            <AppCard
              icon={Heart}
              title="App name"
              description="App description. Max two lines, for example this is a line where it will truncate if it goes longer."
              href="https://transform.gov.sg"
            />
            <AppCard
              icon={Heart}
              title="App name"
              description="App description. Max two lines, for example this is a line where it will truncate if it goes longer."
              href="https://transform.gov.sg"
            />
          </div>
        </div>

        <div className="flex flex-col gap-md">
          <Typography variant="label-lg-strong">Parent and Communication</Typography>

          <div className="grid grid-cols-2 gap-md md:grid-cols-3">
            <AppCard
              icon={Heart}
              title="App name"
              description="App description. Max two lines, for example this is a line where it will truncate if it goes longer."
              href="https://transform.gov.sg"
            />
            <AppCard
              icon={Heart}
              title="App name"
              description="App description. Max two lines, for example this is a line where it will truncate if it goes longer."
              href="https://transform.gov.sg"
            />
            <AppCard
              icon={Heart}
              title="App name"
              description="App description. Max two lines, for example this is a line where it will truncate if it goes longer."
              href="https://transform.gov.sg"
            />
            <AppCard
              icon={Heart}
              title="App name"
              description="App description. Max two lines, for example this is a line where it will truncate if it goes longer."
              href="https://transform.gov.sg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
