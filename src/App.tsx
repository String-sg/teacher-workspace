import './App.css';

import { Home, PanelLeft, UsersRound } from '@flow/icons';
import React from 'react';
import { BrowserRouter, NavLink } from 'react-router';

import { MainView } from './components/MainView';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarItem,
  SidebarProvider,
} from './components/Sidebar';

const items = [
  {
    title: 'Home',
    to: '/',
    icon: Home,
  },
  {
    title: 'Students',
    to: '/students',
    icon: UsersRound,
  },
];

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader icon={PanelLeft} />
          <SidebarContent>
            {items.map((item) => (
              <SidebarItem
                key={item.title}
                as={NavLink}
                to={item.to}
                label={item.title}
                icon={item.icon}
              />
            ))}
          </SidebarContent>
        </Sidebar>
        <MainView />
      </SidebarProvider>
    </BrowserRouter>
  );
};

export default App;
