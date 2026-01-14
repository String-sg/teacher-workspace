import { PanelLeft } from '@flow/icons';
import React from 'react';

import { SidebarTrigger } from './Sidebar';
import { useSidebarContext } from './Sidebar/context';

export const MainView: React.FC = () => {
  const { isCollapsed } = useSidebarContext();

  return (
    <div className="p-md">
      {isCollapsed && (
        <div className="gap-x-xs flex items-center sm:hidden">
          <SidebarTrigger>
            <PanelLeft className="text-slate-11 h-4 w-4" />
          </SidebarTrigger>
          <span className="text-md font-semibold">Home</span>
        </div>
      )}
    </div>
  );
};
