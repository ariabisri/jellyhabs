import * as React from "react"
import { Waves, Anchor, Droplets, Map, Home, Activity, Bug, Database, Users } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Main Menu",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: Home,
        },
        {
          title: "WebGIS",
          url: "/webgis",
          icon: Map,
        },
      ],
    },
    {
      title: "Monitoring",
      items: [
        {
          title: "Stasiun Monitoring",
          url: "/monitoring/stations",
          icon: Anchor,
        },
        {
          title: "Kualitas Air",
          url: "/monitoring/water-quality",
          icon: Droplets,
        },
        {
          title: "Plankton & Ubur-ubur",
          url: "/monitoring/plankton",
          icon: Bug,
        },
      ],
    },
    {
      title: "Kejadian (Events)",
      items: [
        {
          title: "HABs & Jellyfish Bloom",
          url: "/events/habs",
          icon: Activity,
        },
      ],
    },
    {
      title: "Sistem",
      items: [
        {
          title: "Manajemen Dataset",
          url: "/dataset",
          icon: Database,
        },
        {
          title: "Manajemen Pengguna",
          url: "/admin/users",
          icon: Users,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar/80 backdrop-blur-lg transition-colors duration-300" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-3 py-4">
          <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-accent-violet text-primary-foreground shadow-md glow-cyan">
            <Waves className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-bold text-base tracking-wide text-foreground">
              Jelly<span className="text-primary text-glow-cyan">Watch</span>
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">Bioluminescent Marine GIS</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 px-3">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      render={<a href={item.url} />}
                      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
                    >
                      <item.icon className="size-4 text-primary/80" />
                      <span className="font-medium text-sm">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

