import { PanelLeft } from '@flow/icons';
import React from 'react';

import { SidebarTrigger } from './Sidebar';
import { useSidebarContext } from './Sidebar/context';

export const MainView: React.FC = () => {
  const { isCollapsed } = useSidebarContext();

  return (
    <div className="p-4">
      {isCollapsed && (
        <SidebarTrigger className="flex items-center gap-x-2 sm:hidden">
          <div className="flex items-center justify-center rounded-lg p-2">
            <PanelLeft className="text-slate-11 h-4 w-4" />
          </div>
          <span className="text-md font-semibold">Home</span>
        </SidebarTrigger>
      )}
    </div>
  );
};
