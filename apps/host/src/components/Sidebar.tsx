import { CircleHelp, Home, Mail, Settings, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router';

import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from '~/components/ui/sidebar';

interface NavItem {
  title: string;
  icon: LucideIcon;
  href: string;
}

interface MenuItem {
  title: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { title: 'Home', icon: Home, href: '/' },
  { title: 'Student Insights', icon: Users, href: '/students' },
];

const communicationsItems: MenuItem[] = [{ title: 'Posts', icon: Mail }];

function NavMenuItems({ items }: { items: NavItem[] }) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <NavLink to={item.href} end={item.href === '/'}>
            {({ isActive }) => (
              <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                <item.icon className="tw:size-4" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            )}
          </NavLink>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function StaticMenuItems({ items }: { items: MenuItem[] }) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton tooltip={item.title}>
            <item.icon className="tw:size-4" />
            <span>{item.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export function AppSidebar() {
  return (
    <SidebarRoot collapsible="icon">
      <SidebarHeader className="tw:p-0">
        <div className="tw:flex tw:h-14 tw:items-center tw:justify-center tw:gap-2 tw:px-4 tw:group-data-[collapsible=icon]:gap-0 tw:group-data-[collapsible=icon]:px-0">
          <span className="tw:min-w-0 tw:flex-1 tw:cursor-default tw:truncate tw:text-sm tw:font-semibold tw:transition-[opacity,flex] tw:duration-150 tw:select-none tw:group-data-[collapsible=icon]:flex-[0] tw:group-data-[collapsible=icon]:opacity-0">
            Teacher Workspace
            <span className="tw:ml-1.5 tw:rounded-full tw:bg-[#eaf3ff] tw:px-1.5 tw:py-0.5 tw:text-xs tw:font-medium tw:text-[#0064ff]">
              Beta
            </span>
          </span>
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="tw:pb-0">
          <SidebarGroupContent>
            <NavMenuItems items={navItems} />
          </SidebarGroupContent>

          <SidebarSeparator className="tw:mx-0 tw:mt-3 tw:group-data-[collapsible=icon]:mb-3" />
          <SidebarGroupLabel className="tw:mt-2 tw:group-data-[collapsible=icon]:pointer-events-none">
            Communications
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <StaticMenuItems items={communicationsItems} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings">
              <Settings className="tw:size-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Help">
              <CircleHelp className="tw:size-4" />
              <span>Help</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarRoot>
  );
}
