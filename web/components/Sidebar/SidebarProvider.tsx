import React, { useCallback, useMemo, useState } from 'react';

import { useIsMobile } from '~/hooks/useIsMobile';

import { SidebarContext } from './context';

export type SidebarProviderProps = React.PropsWithChildren;

const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = useCallback(
    () => (isMobile ? setIsMobileOpen((prev) => !prev) : setIsOpen((prev) => !prev)),
    [isMobile],
  );

  const contextValue = useMemo(
    () => ({ isOpen, isMobileOpen, isMobile, toggleSidebar }),
    [isOpen, isMobileOpen, isMobile, toggleSidebar],
  );

  return <SidebarContext.Provider value={contextValue}>{children}</SidebarContext.Provider>;
};

export default SidebarProvider;
