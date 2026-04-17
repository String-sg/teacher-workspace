import { HelpCircle, Home, Mail, UsersRound } from 'lucide-react';
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
import { TooltipProvider } from '~/components/ui';
import { useIsWithinViewport } from '~/hooks/useIsWithinViewport';
import { cn } from '~/lib/utils';

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
    <TooltipProvider delay={600}>
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
            <div className="sticky top-0 z-40 bg-background/90 px-4 py-2 backdrop-blur-sm md:px-6">
              <div
                className={cn(
                  'absolute inset-x-0 top-full h-px bg-transparent transition-colors duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)]',
                  !isWithinViewport && 'bg-foreground/[0.075]',
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
