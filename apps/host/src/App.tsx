import { AppSidebar } from '~/components/Sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar';
import { TooltipProvider } from '~/components/ui/tooltip';

export default function App() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="tw:flex tw:h-14 tw:items-center tw:px-4 tw:md:hidden">
            <SidebarTrigger />
          </header>
        <div className="tw:flex tw:flex-1 tw:items-center tw:justify-center tw:p-8">
          <h1 className="tw:text-2xl tw:font-semibold tw:text-muted-foreground">
            Teacher Workspace
          </h1>
        </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
