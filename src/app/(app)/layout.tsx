import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bell, Waves } from "lucide-react";
import React from "react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-x-hidden min-h-screen bg-background">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/60 backdrop-blur-md px-4 md:px-6 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1 text-foreground hover:bg-accent/20" />
            <Separator orientation="vertical" className="h-4 bg-border" />
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Waves className="size-4 text-primary" />
              </div>
              <span className="font-bold tracking-wide text-sm md:text-base">
                JELLYWATCH <span className="text-primary font-extrabold text-glow-cyan">PRO</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative flex size-9 items-center justify-center rounded-full border border-border bg-card/80 text-foreground hover:bg-accent/20 transition-all" title="Notifikasi (segera hadir)">
              <Bell className="size-4" />
            </button>

            <ThemeToggle />

            <div className="hidden sm:flex items-center gap-2.5 border-l border-border pl-3 ml-1">
              <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-accent-violet text-primary-foreground font-bold text-xs shadow-sm">
                U
              </div>
              <div className="flex flex-col text-xs leading-tight">
                <span className="font-medium text-foreground">Pengguna</span>
                <span className="text-[10px] text-muted-foreground">Jellywatch Pro</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}

