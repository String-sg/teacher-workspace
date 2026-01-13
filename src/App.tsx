import './App.css';

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, Typography } from '@flow/core';
import React from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';

import Home from '@/pages/Home';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const getBreadcrumbPage = () => {
    switch (location.pathname) {
      case '/':
        return 'Home';
      case '/students':
        return 'Students';
      default:
        return null;
    }
  };

  const currentPage = getBreadcrumbPage();

  return (
    <div className="flex">
      <div className="h-auto min-h-screen w-[16rem] bg-red-100 p-4">
        <div className="gap-md flex flex-col">
          <div className="italic">Temp sidebar</div>
          <Link to="/" className="hover:underline">
            Home
          </Link>
          <Link to="/students" className="hover:underline">
            Students
          </Link>
        </div>
      </div>

      <div className="flex w-full flex-col">
        <div className="p-lg">
          <Breadcrumb size="md">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink>
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
          <Route path="/" element={<Home />} />
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
