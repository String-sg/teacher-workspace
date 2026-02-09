import './App.css';

import React from 'react';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router';

import RootLayout from './containers/RootLayout';

const router = createBrowserRouter([
  {
    path: '/',
    Component: Outlet,
    HydrateFallback: () => null,
    children: [
      {
        path: '/',
        Component: RootLayout,
        children: [
          {
            index: true,
            lazy: () => import('./containers/HomeView'),
          },
          {
            path: 'students',
            lazy: () => import('./containers/StudentsView'),
          },
        ],
      },
      {
        path: 'login',
        lazy: () => import('./containers/LoginView'),
      },
    ],
  },
]);

const App: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default App;
