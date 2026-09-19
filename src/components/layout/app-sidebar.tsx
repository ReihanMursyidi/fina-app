'use client';

import { usePathname } from "next/navigation";
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger
} from "../ui/sidebar";
import Link from 'next/link';
import { BanknoteIcon, CoinsIcon, LayoutDashboardIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeToggle } from "../mode-toggle";

const sidebarItems = [
  {
    label: 'Dashboard',
    icon: <LayoutDashboardIcon />,
    href: '/dashboard',
  },
  {
    label: 'Transaction',
    icon: <BanknoteIcon />,
    href: '/dashboard/transaction',
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="floating">
      
      <SidebarHeader
        className="flex items-center justify-between gap-2 flex-row
                    group-data-[collapsible=icon]:flex-col-reverse
                    group-data-[collapsible=icon]:gap-4 
                    group-data-[collapsible=icon]:pt-2"
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/">
                <CoinsIcon className="text-primary size-5!" />
                <h1 className="text-2xl font-bold text-primary group-data-[collapsible=icon]:hidden">
                  Fina App
                </h1>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <SidebarTrigger />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {sidebarItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.label}
                  className={cn(
                    'py-6 px-5 text-md',
                    pathname === item.href
                      ? 'bg-primary text-primary-foreground font-semibold hover:bg-primary hover:text-primary-foreground'
                      : '',
                  )}
                >
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        
      </SidebarContent>
      <SidebarFooter>
        <div className="flex w-full justify-end">
          <ModeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}