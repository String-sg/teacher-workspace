import { TooltipProvider } from '@flow/core';
import { Home, UsersRound } from '@flow/icons';
import React from 'react';
import { Outlet } from 'react-router';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarItem,
  SidebarProvider,
} from '~/components/Sidebar';

const RootLayout: React.FC = () => {
  return (
    <TooltipProvider delayDuration={600}>
      <div className="flex min-h-svh">
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader />

            <SidebarContent>
              <SidebarItem icon={Home} label="Home" to="/" tooltip="Home" />
              <SidebarItem icon={UsersRound} label="Students" to="/students" tooltip="Students" />
            </SidebarContent>
          </Sidebar>

          <div className="relative flex-1">
            <Outlet />
          </div>
        </SidebarProvider>
      </div>
    </TooltipProvider>
  );
};

export default RootLayout;
