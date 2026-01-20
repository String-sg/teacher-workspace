import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, Typography } from '@flow/core';
import React from 'react';
import { Link, useLocation } from 'react-router';

interface PageHeaderProps {
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
}

const breadcrumbPages: Record<string, string> = {
  '/': 'Home',
  '/students': 'Students',
  '/login': 'Sign in',
};

export const PageHeader: React.FC<PageHeaderProps> = ({ leftActions, rightActions }) => {
  const location = useLocation();

  const currentPage = breadcrumbPages[location.pathname] ?? null;
  const breadcrumb = currentPage ? (
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
  ) : null;

  return (
    <div className="sticky top-0 z-10 flex h-16 w-full items-center justify-between bg-slate-1 px-lg py-sm">
      <div className="flex items-center gap-x-xs">
        {leftActions}
        {breadcrumb}
      </div>

      {rightActions}
    </div>
  );
};
