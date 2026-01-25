import { TooltipProvider } from '@flow/core';
import { Home, UsersRound } from '@flow/icons';
import React, { useMemo } from 'react';
import { Outlet, useLocation } from 'react-router';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarItem,
  SidebarProvider,
} from '~/components/Sidebar';

const RootLayout: React.FC = () => {
  const location = useLocation();

  const segment = location.pathname.split('/')[1];
  const selected = useMemo(() => {
    switch (segment) {
      case 'students':
        return segment;
      default:
        return '/';
    }
  }, [segment]);

  return (
    <TooltipProvider delayDuration={600}>
      <div className="flex min-h-svh">
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader />

            <SidebarContent>
              <SidebarItem
                kind="link"
                icon={Home}
                label="Home"
                tooltip="Home"
                to="/"
                selected={selected === '/'}
              />
              <SidebarItem
                kind="link"
                icon={UsersRound}
                label="Students"
                tooltip="Students"
                to="/students"
                selected={selected === 'students'}
              />
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
