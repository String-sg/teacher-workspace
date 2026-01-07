import './App.css';

import React from 'react';

import { Sidebar, SidebarProvider, SidebarTrigger } from './components/Sidebar';

const App: React.FC = () => {
  return (
    <SidebarProvider>
      <Sidebar />

      <div className="w-full">
        Main View
        <SidebarTrigger />
      </div>
    </SidebarProvider>
  );
};

export default App;
