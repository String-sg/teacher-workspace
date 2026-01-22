import './App.css';

import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';

import HomeView from './containers/HomeView';
import RootLayout from './containers/RootLayout';
import StudentsView from './containers/StudentsView';

const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      {
        index: true,
        Component: HomeView,
      },
      {
        path: 'students',
        Component: StudentsView,
      },
    ],
  },
]);

const App: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default App;
