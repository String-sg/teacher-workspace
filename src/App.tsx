import './App.css';

import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';

import RootLayout from './containers/RootLayout';

const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    HydrateFallback: () => null,
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
]);

const App: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default App;
