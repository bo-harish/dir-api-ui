import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface LayoutProps {
  children?: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 bg-background">
          <div className="p-2 border-b border-border md:hidden">
            <SidebarTrigger />
          </div>
          {children || <Outlet />}
        </main>
      </div>
    </SidebarProvider>
  );
}
