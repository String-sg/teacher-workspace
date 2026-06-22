import { BrowserRouter, Route, Routes } from 'react-router';

import { AppSidebar } from '~/components/Sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar';
import { TooltipProvider } from '~/components/ui/tooltip';
import { HomeView } from '~/containers/HomeView';
import { NotFoundView } from '~/containers/NotFoundView';
import { ParentsGatewayView } from '~/containers/ParentsGatewayView';
import { StudentsView } from '~/containers/StudentsView';

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="tw:flex tw:h-14 tw:items-center tw:px-4 tw:md:hidden">
              <SidebarTrigger />
            </header>
            <Routes>
              <Route path="/" element={<HomeView />} />
              <Route path="/students/*" element={<StudentsView />} />
              <Route path="/posts/*" element={<ParentsGatewayView />} />
              <Route path="*" element={<NotFoundView />} />
            </Routes>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </BrowserRouter>
  );
}
