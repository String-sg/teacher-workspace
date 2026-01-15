import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, Typography } from '@flow/core';
import { PanelLeft } from '@flow/icons';
import React from 'react';
import { Link, useLocation } from 'react-router';

import { SidebarTrigger } from './Sidebar';
import { useSidebarContext } from './Sidebar/context';

const breadcrumbPages: Record<string, string> = {
  '/': 'Home',
  '/students': 'Students',
};

export const MainView: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isCollapsed } = useSidebarContext();
  const location = useLocation();

  const currentPage = breadcrumbPages[location.pathname] ?? null;

  return (
    <div className="p-md lg:p-lg bg-slate-1">
      <div className="gap-x-xs flex items-center">
        {isCollapsed && (
          <div className="sm:hidden">
            <SidebarTrigger>
              <PanelLeft className="text-slate-11 h-4 w-4" />
            </SidebarTrigger>
          </div>
        )}

        <Breadcrumb size="md">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={location.pathname}>
                  <Typography variant="label-md-strong" className="text-slate-12">
                    {currentPage}
                  </Typography>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {children}
    </div>
  );
};
