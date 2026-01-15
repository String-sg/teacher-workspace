import './App.css';

import { Home, PanelLeft, UsersRound } from '@flow/icons';
import React from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router';

import { MainView } from './components/MainView';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarItem,
  SidebarProvider,
} from './components/Sidebar';
import HomePage from './pages/Home';

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
        <MainView>
          <Routes>
            <Route path="/" element={<HomePage name="Cher" />} />
            <Route
              path="/students"
              element={<div className="text-gray-7 italic">SDT goes here</div>}
            />
          </Routes>
        </MainView>
      </SidebarProvider>
    </BrowserRouter>
  );
};

export default App;
