"use client"

import * as React from "react"
import { DynamicMap } from "@/components/map/dynamic-map"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  Anchor,
  Activity,
  Bug,
  Search,
  RefreshCw,
  Layers,
  ShieldAlert,
  SlidersHorizontal,
  ChevronRight,
  Loader2,
  Info,
} from "lucide-react"
import { StationFeature, BloomEventFeature, StingHotspotFeature } from "@/components/map/map-view"
import { cn } from "@/lib/utils"

interface SpatialSummary {
  stations: {
    total: number
    active: number
    inactive: number
  }
  events: {
    total: number
    habs: { total: number; active: number }
    jellyfish: { total: number; active: number }
    alerts: { darurat: number; siaga: number; waspada: number; normal: number }
  }
  provinces: string[]
}

export default function WebGISPage() {
  // Layer Visibility
  const [showStations, setShowStations] = React.useState(true)
  const [showHabs, setShowHabs] = React.useState(true)
  const [showJellyfish, setShowJellyfish] = React.useState(true)
  const [showStings, setShowStings] = React.useState(true)

  // Filters
  const [search, setSearch] = React.useState("")
  const [provinceFilter, setProvinceFilter] = React.useState("all")
  const [alertFilter, setAlertFilter] = React.useState("all")
  const [activeOnly, setActiveOnly] = React.useState(false)

  // Data States
  const [stations, setStations] = React.useState<StationFeature[]>([])
  const [habsEvents, setHabsEvents] = React.useState<BloomEventFeature[]>([])
  const [jellyfishEvents, setJellyfishEvents] = React.useState<BloomEventFeature[]>([])
  const [stingHotspots, setStingHotspots] = React.useState<StingHotspotFeature[]>([])
  const [summary, setSummary] = React.useState<SpatialSummary | null>(null)
  const [loading, setLoading] = React.useState(true)

  // Fetch Summary Metadata
  const fetchSummary = React.useCallback(async () => {
    try {
      const res = await fetch("/api/spatial/summary")
      const data = await res.json()
      if (data.success) {
        setSummary(data.data)
      }
    } catch (err) {
      console.error("Error loading spatial summary:", err)
    }
  }, [])

  // Fetch Spatial GeoJSON Data
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)

      // 1. Fetch Stations GeoJSON
      const stationParams = new URLSearchParams()
      if (search.trim()) stationParams.append("q", search.trim())
      if (provinceFilter !== "all") stationParams.append("province", provinceFilter)
      if (activeOnly) stationParams.append("has_active_bloom", "true")

      const stationsRes = await fetch(`/api/spatial/stations?${stationParams.toString()}`)
      const stationsGeoJson = await stationsRes.json()

      const parsedStations: StationFeature[] = (stationsGeoJson.features || []).map(
        (f: { properties: StationFeature; geometry: { coordinates: [number, number] } }) => ({
          ...f.properties,
          longitude: f.geometry.coordinates[0],
          latitude: f.geometry.coordinates[1],
        })
      )
      setStations(parsedStations)

      // 2. Fetch Events GeoJSON
      const eventParams = new URLSearchParams()
      if (search.trim()) eventParams.append("q", search.trim())
      if (alertFilter !== "all") eventParams.append("alert_status", alertFilter)
      if (activeOnly) eventParams.append("is_active", "true")

      const eventsRes = await fetch(`/api/spatial/events?${eventParams.toString()}`)
      const eventsGeoJson = await eventsRes.json()

      const habs: BloomEventFeature[] = []
      const jelly: BloomEventFeature[] = []

      ;(eventsGeoJson.features || []).forEach(
        (f: { properties: BloomEventFeature; geometry: { coordinates: [number, number] } }) => {
          const item: BloomEventFeature = {
            ...f.properties,
            longitude: f.geometry.coordinates[0],
            latitude: f.geometry.coordinates[1],
          }
          if (item.event_type === "Harmful Algal Blooms") {
            habs.push(item)
          } else {
            jelly.push(item)
          }
        }
      )

      setHabsEvents(habs)
      setJellyfishEvents(jelly)

      // 3. Fetch Sting Hotspots GeoJSON
      try {
        const stingsRes = await fetch("/api/spatial/stings")
        const stingsGeoJson = await stingsRes.json()
        if (stingsGeoJson.features) {
          const parsedStings: StingHotspotFeature[] = stingsGeoJson.features.map(
            (f: { properties: StingHotspotFeature; geometry: { coordinates: [number, number] } }) => ({
              ...f.properties,
              longitude: f.geometry.coordinates[0],
              latitude: f.geometry.coordinates[1],
            })
          )
          setStingHotspots(parsedStings)
        }
      } catch (stErr) {
        console.error("Error fetching sting hotspots:", stErr)
      }
    } catch (err) {
      console.error("Error fetching WebGIS spatial data:", err)
    } finally {
      setLoading(false)
    }
  }, [search, provinceFilter, alertFilter, activeOnly])

  React.useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchData()
    }, 250)
    return () => clearTimeout(timer)
  }, [fetchData])

  const totalVisibleMarkers =
    (showStations ? stations.length : 0) +
    (showHabs ? habsEvents.length : 0) +
    (showJellyfish ? jellyfishEvents.length : 0)

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-7.5rem)] min-h-[650px]">
      {/* Header & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <span>Peta Tematik</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-foreground">WebGIS Interaktif</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            Peta Sebaran Spasial WebGIS
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <Badge variant="outline" className="font-mono bg-card px-2.5 py-1">
            <Anchor className="h-3 w-3 mr-1 text-primary" />
            {stations.length} Stasiun
          </Badge>
          <Badge variant="outline" className="font-mono bg-card px-2.5 py-1 text-rose-600 dark:text-rose-400">
            <Activity className="h-3 w-3 mr-1" />
            {habsEvents.length} HABs
          </Badge>
          <Badge variant="outline" className="font-mono bg-card px-2.5 py-1 text-purple-600 dark:text-purple-400">
            <Bug className="h-3 w-3 mr-1" />
            {jellyfishEvents.length} Jellyfish
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              fetchSummary()
              fetchData()
            }}
            className="h-7 text-xs px-2 shadow-2xs"
            title="Muat Ulang Layer"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin text-primary")} />
          </Button>
        </div>
      </div>

      {/* Main Grid: Sidebar Controls & Interactive Map */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 h-full min-h-0 overflow-hidden">
        {/* Sidebar Kontrol & Filter */}
        <Card className="col-span-1 h-full flex flex-col overflow-hidden shadow-xs">
          <CardHeader className="p-4 border-b shrink-0">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Kontrol Layer & Filter
            </CardTitle>
            <CardDescription className="text-xs">
              Atur visibilitas layer dan filter data spasial
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto text-xs">
            {/* Pencarian Lokasi */}
            <div className="space-y-1.5">
              <Label htmlFor="search" className="text-xs font-semibold">Cari Lokasi / Stasiun</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nama stasiun, kota, kode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
              </div>
            </div>

            {/* Layer Toggles */}
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-primary" />
                Layer Peta Aktif
              </Label>

              <div className="space-y-1.5">
                {/* Toggle Stasiun */}
                <label className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-muted/40 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showStations}
                      onChange={(e) => setShowStations(e.target.checked)}
                      className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#00B4D8] inline-block" />
                      <span>Stasiun Monitoring</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-mono">{stations.length}</Badge>
                </label>

                {/* Toggle HABs */}
                <label className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-muted/40 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showHabs}
                      onChange={(e) => setShowHabs(e.target.checked)}
                      className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#D90429] inline-block" />
                      <span>Kejadian HABs</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-mono">{habsEvents.length}</Badge>
                </label>

                {/* Toggle Jellyfish */}
                <label className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-muted/40 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showJellyfish}
                      onChange={(e) => setShowJellyfish(e.target.checked)}
                      className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#7209B7] inline-block" />
                      <span>Jellyfish Bloom</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-mono">{jellyfishEvents.length}</Badge>
                </label>

                {/* Toggle Sting Hotspots */}
                <label className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-muted/40 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showStings}
                      onChange={(e) => setShowStings(e.target.checked)}
                      className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#F77F00] inline-block" />
                      <span>Hotspot Sengatan</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-mono text-amber-500 bg-amber-500/10">
                    {stingHotspots.length} Pantai
                  </Badge>
                </label>
              </div>
            </div>

            {/* Filter Provinsi & Status */}
            <div className="space-y-3 pt-2 border-t">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Filter Parameter
              </Label>

              <div className="space-y-1.5">
                <Label htmlFor="province-filter" className="text-[11px] text-muted-foreground">Wilayah Provinsi</Label>
                <Select value={provinceFilter} onValueChange={(val) => setProvinceFilter(val || "all")}>
                  <SelectTrigger id="province-filter" className="w-full text-xs h-8">
                    <SelectValue placeholder="Semua Provinsi">
                      {provinceFilter === "all" ? "Semua Provinsi" : provinceFilter}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Provinsi</SelectItem>
                    {summary?.provinces.map((prov) => (
                      <SelectItem key={prov} value={prov}>
                        {prov}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="alert-filter" className="text-[11px] text-muted-foreground">Status Peringatan</Label>
                <Select value={alertFilter} onValueChange={(val) => setAlertFilter(val || "all")}>
                  <SelectTrigger id="alert-filter" className="w-full text-xs h-8">
                    <SelectValue placeholder="Semua Status">
                      {alertFilter === "all" ? "Semua Status" : alertFilter}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="Darurat">Darurat (Merah)</SelectItem>
                    <SelectItem value="Siaga">Siaga (Oranye)</SelectItem>
                    <SelectItem value="Waspada">Waspada (Kuning)</SelectItem>
                    <SelectItem value="Normal">Normal (Hijau)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <label className="flex items-center gap-2 pt-1 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                />
                <span className="font-medium">Hanya kejadian aktif saat ini</span>
              </label>
            </div>

            {/* Legenda Peta */}
            <div className="mt-auto pt-3 border-t space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-primary" />
                Legenda Peta
              </Label>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground p-2.5 rounded-lg bg-muted/20 border">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#00B4D8]" />
                  <span>Stasiun</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#D90429]" />
                  <span>HABs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#7209B7]" />
                  <span>Ubur-ubur</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F77F00] animate-pulse" />
                  <span>Siaga/Darurat</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Peta Interaktif Leaflet Container */}
        <Card className="col-span-1 lg:col-span-3 h-full overflow-hidden relative shadow-xs border">
          <CardContent className="p-0 h-full relative z-0">
            {loading && (
              <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-lg bg-background/90 backdrop-blur-md border shadow-md flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>Memperbarui layer spasial...</span>
              </div>
            )}
            <DynamicMap
              stations={stations}
              habsEvents={habsEvents}
              jellyfishEvents={jellyfishEvents}
              stingHotspots={stingHotspots}
              showStations={showStations}
              showHabs={showHabs}
              showJellyfish={showJellyfish}
              showStingHotspots={showStings}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
