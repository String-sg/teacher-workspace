import { createContext, useContext } from 'react';

export interface SidebarContextValues {
  /**
   * Whether the sidebar is collapsed.
   */
  isCollapsed: boolean;
  /**
   * Toggle the sidebar collapsed state.
   */
  toggleSidebar: () => void;
}

export const SidebarContext = createContext<SidebarContextValues | undefined>(undefined);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("'useSidebarContext' must be used within a 'Sidebar' component");
  }

  return context;
}
