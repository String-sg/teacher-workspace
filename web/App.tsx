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
      {
        path: 'posts',
        lazy: () => import('./containers/PostsView'),
      },
      {
        path: 'posts/new',
        lazy: () => import('./containers/CreatePostView'),
      },
      {
        path: 'posts/:id',
        lazy: () => import('./containers/PostDetailView'),
      },
      {
        path: 'posts/:id/edit',
        lazy: () => import('./containers/CreatePostView'),
      },
      {
        path: 'components',
        lazy: () => import('./containers/ComponentsView'),
      },
      {
        path: 'session-expired',
        lazy: () => import('./containers/SessionExpiredView'),
      },
    ],
  },
]);

const App: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default App;
