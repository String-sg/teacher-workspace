import React from 'react';

import { SidebarTrigger } from '~/components/Sidebar';

const HomeView: React.FC = () => {
  return (
    <div className="relative w-full flex-1">
      <SidebarTrigger />
    </div>
  );
};

export default HomeView;
