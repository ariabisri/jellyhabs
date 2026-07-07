import * as React from "react"
import { Anchor, Droplets, Map, Home, Search, Settings, Activity, Bug, Database, Users } from "lucide-react"

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

// This is sample data.
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
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Anchor className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold text-lg">JellyHABs-GIS</span>
            <span className="text-xs text-muted-foreground">Monitoring System</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton render={<a href={item.url} />}>
                      <item.icon />
                      <span>{item.title}</span>
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
