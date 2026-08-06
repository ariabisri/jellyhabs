"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Waves,
  Anchor,
  Droplets,
  Map,
  Home,
  Activity,
  Bug,
  Database,
  Users,
  Calendar,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

type SubNavItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

type NavItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  subItems?: SubNavItem[]
}

type NavGroup = {
  title: string
  items: NavItem[]
}

const navData: NavGroup[] = [
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
        subItems: [
          {
            title: "Kualitas Air",
            url: "/monitoring/stations/water-quality",
            icon: Droplets,
          },
          {
            title: "Plankton & Ubur-ubur",
            url: "/monitoring/stations/plankton",
            icon: Bug,
          },
        ],
      },
      {
        title: "Sampling Event",
        url: "/monitoring/sampling",
        icon: Calendar,
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
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  // Track expanded state for items with sub-items
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>({
    "Stasiun Monitoring": true, // Default open for Monitoring group
  })

  // Auto expand parent if current pathname is in sub-items
  React.useEffect(() => {
    navData.forEach((group) => {
      group.items.forEach((item) => {
        if (item.subItems) {
          const isSubActive = item.subItems.some((sub) => pathname.startsWith(sub.url))
          const isParentActive = pathname.startsWith(item.url)
          if (isSubActive || isParentActive) {
            setOpenItems((prev) => ({ ...prev, [item.title]: true }))
          }
        }
      })
    })
  }, [pathname])

  const toggleItem = (title: string) => {
    setOpenItems((prev) => ({ ...prev, [title]: !prev[title] }))
  }

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
        {navData.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 px-3">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const hasSubItems = Boolean(item.subItems && item.subItems.length > 0)
                  const isOpen = openItems[item.title] ?? false
                  const isActive = pathname === item.url || (hasSubItems && pathname.startsWith(item.url))

                  if (hasSubItems) {
                    return (
                      <SidebarMenuItem key={item.title}>
                        <div className="flex items-center w-full">
                          <SidebarMenuButton
                            render={<a href={item.url} />}
                            isActive={isActive}
                            className="flex-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
                          >
                            <item.icon className="size-4 text-primary/80" />
                            <span className="font-medium text-sm flex-1">{item.title}</span>
                          </SidebarMenuButton>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleItem(item.title)
                            }}
                            className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors mr-1"
                            title={isOpen ? "Tutup Sub-menu" : "Buka Sub-menu"}
                          >
                            {isOpen ? (
                              <ChevronDown className="size-3.5 text-primary" />
                            ) : (
                              <ChevronRight className="size-3.5" />
                            )}
                          </button>
                        </div>

                        {isOpen && (
                          <SidebarMenuSub className="mt-1 space-y-0.5">
                            {item.subItems?.map((sub) => {
                              const isSubActive = pathname === sub.url
                              return (
                                <SidebarMenuSubItem key={sub.title}>
                                  <SidebarMenuSubButton
                                    render={<a href={sub.url} />}
                                    isActive={isSubActive}
                                    className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
                                  >
                                    <sub.icon className="size-3.5 text-primary/70" />
                                    <span>{sub.title}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              )
                            })}
                          </SidebarMenuSub>
                        )}
                      </SidebarMenuItem>
                    )
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        render={<a href={item.url} />}
                        isActive={isActive}
                        className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
                      >
                        <item.icon className="size-4 text-primary/80" />
                        <span className="font-medium text-sm">{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
