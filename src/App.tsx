import './App.css';

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, Typography } from '@flow/core';
import React from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router';

import Home from '@/pages/Home';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const breadcrumbPages: Record<string, string> = {
    '/': 'Home',
    '/students': 'Students',
  };

  const currentPage = breadcrumbPages[location.pathname] ?? null;

  return (
    <div className="flex">
      <div className="flex w-full flex-col">
        <div className="p-lg">
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
        <div className="px-md pb-md lg:px-lg w-full">{children}</div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home name="Cher" />} />
          <Route
            path="/students"
            element={<div className="text-gray-7 italic">SDT goes here</div>}
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
