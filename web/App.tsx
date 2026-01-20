import './App.css';

import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';

import ModalLayout from './containers/ModalLayout';
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
  {
    path: '/',
    Component: ModalLayout,
    HydrateFallback: () => null,
    children: [
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
