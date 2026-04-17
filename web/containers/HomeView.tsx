import { Heart } from 'lucide-react';
import React from 'react';

import AppCard from '~/components/AppCard';
import { getDayPeriod } from '~/helpers/dateTime';

const HomeView: React.FC = () => {
  const dayPeriod = getDayPeriod();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-14 px-4 py-12 sm:pt-20">
      <h1 className="p-2 text-center text-2xl font-semibold tracking-tight">Good {dayPeriod}</h1>

      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Featured</h2>

          <AppCard
            icon={Heart}
            title="App name"
            description="App description. Max two lines, for example this is a line where it will truncate if it goes longer."
            direction="horizontal"
            href="https://transform.gov.sg"
          />
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Classroom and Student</h2>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
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

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Parent and Communication</h2>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
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

export { HomeView as Component };
