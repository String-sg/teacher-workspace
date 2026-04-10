import { cn, TooltipProvider } from '@flow/core';
import { HelpCircle, Home, Mail, UsersRound } from '@flow/icons';
import React, { useMemo, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';

import { ChunkErrorBoundary } from '~/components/ChunkErrorBoundary';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarItem,
  SidebarProvider,
  SidebarTrigger,
} from '~/components/Sidebar';
import SidebarFooter from '~/components/Sidebar/SidebarFooter';
import { useIsWithinViewport } from '~/hooks/useIsWithinViewport';

const RootLayout: React.FC = () => {
  const topbarRef = useRef<HTMLDivElement>(null);
  const isWithinViewport = useIsWithinViewport(topbarRef);

  const location = useLocation();

  const segment = location.pathname.split('/')[1];
  const selected = useMemo(() => {
    switch (segment) {
      case 'students':
      case 'posts':
        return segment;
      default:
        return '/';
    }
  }, [segment]);

  return (
    <TooltipProvider delayDuration={600}>
      <div className="flex h-svh">
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader />

            <SidebarContent>
              <SidebarItem
                icon={Home}
                label="Home"
                tooltip="Home"
                to="/"
                selected={selected === '/'}
              />
              <SidebarItem
                icon={UsersRound}
                label="Students"
                tooltip="Students"
                to="/students"
                selected={selected === 'students'}
              />
              <SidebarItem
                icon={Mail}
                label="Posts"
                tooltip="Posts"
                to="/posts"
                selected={selected === 'posts'}
              />
            </SidebarContent>

            <SidebarFooter>
              <SidebarItem
                icon={HelpCircle}
                label="Help"
                tooltip="Help"
                href="https://transform.gov.sg/"
              />
            </SidebarFooter>
          </Sidebar>

          <div className="relative flex-1 overflow-y-auto">
            <div className="sticky top-0 z-999 bg-page/90 px-md py-sm backdrop-blur-sm md:px-lg">
              <div
                className={cn(
                  'ease-tw-default absolute inset-x-0 top-full h-px bg-transparent transition-colors duration-300',
                  !isWithinViewport && 'bg-slate-12/7.5',
                )}
              />

              <SidebarTrigger />
            </div>

            <div ref={topbarRef} className="absolute inset-x-0 top-0 h-px" />

            <ChunkErrorBoundary>
              <React.Suspense fallback={null}>
                <Outlet />
              </React.Suspense>
            </ChunkErrorBoundary>
          </div>
        </SidebarProvider>
      </div>
    </TooltipProvider>
  );
};

export default RootLayout;
