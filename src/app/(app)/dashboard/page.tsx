"use client"

import * as React from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  Anchor,
  Bug,
  Droplets,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Calendar,
  ArrowRight,
  ShieldAlert,
  Layers,
  Loader2,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from "lucide-react"
import { LineChart } from "@/components/charts/line-chart"
import { BarChart } from "@/components/charts/bar-chart"
import { PieChart } from "@/components/charts/pie-chart"
import { cn } from "@/lib/utils"

interface DashboardStats {
  stations: {
    total_stations: number
    active_stations: number
    inactive_stations: number
    total_provinces: number
  }
  samplings: {
    total_samplings: number
    recent_samplings_30d: number
    recent_samplings_7d: number
  }
  data_records: {
    total_water_quality_records: number
    total_plankton_records: number
    total_datasets: number
  }
  habs: {
    total_habs_events: number
    active_habs_events: number
    habs_darurat: number
    habs_siaga: number
    habs_waspada: number
    habs_normal: number
    habs_kritis: number
    habs_tinggi: number
  }
  jellyfish: {
    total_jellyfish_events: number
    active_jellyfish_events: number
    jellyfish_darurat: number
    jellyfish_siaga: number
    jellyfish_waspada: number
    jellyfish_normal: number
    jellyfish_kritis: number
    jellyfish_tinggi: number
  }
  species: {
    total_species: number
    toxic_species: number
    phytoplankton_species: number
    zooplankton_species: number
    jellyfish_species: number
  }
  active_alerts: {
    id: string
    event_code: string
    event_type: string
    event_start_date: string
    event_end_date: string | null
    severity_level: string
    alert_status: string
    description: string | null
    station_id: string
    station_code: string
    station_name: string
    city: string
    province: string
  }[]
}

interface WaterQualityTrendData {
  parameter: string
  label: string
  unit: string
  xAxisData: string[]
  seriesData: number[]
}

interface EventDistributionData {
  by_province: {
    xAxisData: string[]
    habsSeries: number[]
    jellyfishSeries: number[]
    totalSeries: number[]
  }
  by_alert_status: { label: string; total_events: number; habs_count: number; jellyfish_count: number }[]
  by_severity: { label: string; total_events: number; habs_count: number; jellyfish_count: number }[]
}

interface SpeciesDistributionData {
  top_species: {
    species_id: string
    species_code: string
    scientific_name: string
    common_name: string | null
    organism_category: string
    is_toxic: boolean
    records_count: number
    avg_density: number
    max_density: number
    density_unit: string | null
  }[]
  by_category: { label: string; total_records: number; unique_species_count: number }[]
}

interface StationOption {
  id: string
  station_code: string
  name: string
}

export default function DashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = React.useState(true)

  // Trend Chart State
  const [trendParameter, setTrendParameter] = React.useState("chlorophyll_a_ugl")
  const [trendStation, setTrendStation] = React.useState("all")
  const [trendData, setTrendData] = React.useState<WaterQualityTrendData | null>(null)
  const [trendLoading, setTrendLoading] = React.useState(true)

  // Event Distribution State
  const [eventDistData, setEventDistData] = React.useState<EventDistributionData | null>(null)
  const [eventDistLoading, setEventDistLoading] = React.useState(true)

  // Species Distribution State
  const [speciesDistData, setSpeciesDistData] = React.useState<SpeciesDistributionData | null>(null)
  const [speciesDistLoading, setSpeciesDistLoading] = React.useState(true)

  // Stations List for dropdown
  const [stations, setStations] = React.useState<StationOption[]>([])

  // Fetch Summary Stats
  const fetchStats = React.useCallback(async () => {
    try {
      setStatsLoading(true)
      const res = await fetch("/api/dashboard/stats")
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (err) {
      console.error("Error fetching dashboard stats:", err)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // Fetch Trend Data
  const fetchTrend = React.useCallback(async () => {
    try {
      setTrendLoading(true)
      const params = new URLSearchParams({
        parameter: trendParameter,
        station_id: trendStation,
        interval: "monthly",
      })
      const res = await fetch(`/api/dashboard/charts/water-quality-trend?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setTrendData(data.data)
      }
    } catch (err) {
      console.error("Error fetching trend data:", err)
    } finally {
      setTrendLoading(false)
    }
  }, [trendParameter, trendStation])

  // Fetch Event Distribution
  const fetchEventDist = React.useCallback(async () => {
    try {
      setEventDistLoading(true)
      const res = await fetch("/api/dashboard/charts/event-distribution")
      const data = await res.json()
      if (data.success) {
        setEventDistData(data.data)
      }
    } catch (err) {
      console.error("Error fetching event distribution:", err)
    } finally {
      setEventDistLoading(false)
    }
  }, [])

  // Fetch Species Distribution
  const fetchSpeciesDist = React.useCallback(async () => {
    try {
      setSpeciesDistLoading(true)
      const res = await fetch("/api/dashboard/charts/species-distribution")
      const data = await res.json()
      if (data.success) {
        setSpeciesDistData(data.data)
      }
    } catch (err) {
      console.error("Error fetching species distribution:", err)
    } finally {
      setSpeciesDistLoading(false)
    }
  }, [])

  // Fetch Stations for selector
  const fetchStations = React.useCallback(async () => {
    try {
      const res = await fetch("/api/stations?status=aktif")
      const data = await res.json()
      if (data.success && data.data) {
        setStations(data.data)
      }
    } catch (err) {
      console.error("Error fetching stations:", err)
    }
  }, [])

  React.useEffect(() => {
    fetchStats()
    fetchEventDist()
    fetchSpeciesDist()
    fetchStations()
  }, [fetchStats, fetchEventDist, fetchSpeciesDist, fetchStations])

  React.useEffect(() => {
    fetchTrend()
  }, [fetchTrend])

  const totalActiveUrgentAlerts =
    (stats?.habs?.habs_darurat || 0) +
    (stats?.habs?.habs_siaga || 0) +
    (stats?.jellyfish?.jellyfish_darurat || 0) +
    (stats?.jellyfish?.jellyfish_siaga || 0)

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="h-7 w-7 text-primary" />
            Dashboard Monitoring
          </h1>
          <p className="text-muted-foreground">
            Ringkasan analitik data monitoring pesisir, kualitas air, serta pemantauan kejadian HABs dan blooming ubur-ubur secara terpadu.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchStats()
              fetchTrend()
              fetchEventDist()
              fetchSpeciesDist()
            }}
            className="p-2 text-xs font-semibold rounded-lg border bg-card hover:bg-muted transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Segarkan Data"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-primary", statsLoading && "animate-spin")} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* ACTIVE EARLY WARNING ALERT BANNER */}
      {totalActiveUrgentAlerts > 0 && stats?.active_alerts && stats.active_alerts.length > 0 && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-foreground flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-destructive text-destructive-foreground shrink-0 mt-0.5">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-destructive">
                  Peringatan Dini: {totalActiveUrgentAlerts} Kejadian Status Siaga / Darurat Aktif!
                </h3>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Terdeteksi eskalasi kejadian blooming di stasiun:{" "}
                <strong className="text-foreground">
                  {stats.active_alerts.slice(0, 3).map((a) => a.station_name).join(", ")}
                </strong>
                . Harap periksa protokol respon mitigasi.
              </p>
            </div>
          </div>
          <Link
            href="/events/habs"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold transition-colors shrink-0 self-start md:self-auto shadow-xs"
          >
            <span>Tinjau Kejadian</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* 4 PRIMARY KPI METRIC CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Stasiun Monitoring */}
        <Link href="/monitoring/stations" className="group">
          <Card className="h-full transition-all duration-200 group-hover:border-primary/40 group-hover:shadow-[0_0_15px_rgba(0,180,216,0.12)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stasiun Monitoring</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Anchor className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : stats?.stations.total_stations || 0}
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                  <strong className="text-foreground font-semibold">{stats?.stations.active_stations || 0}</strong> aktif
                </span>
                <span>{stats?.stations.total_provinces || 0} Provinsi</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 2: Total Sampling Events */}
        <Link href="/monitoring/sampling" className="group">
          <Card className="h-full transition-all duration-200 group-hover:border-primary/40 group-hover:shadow-[0_0_15px_rgba(0,180,216,0.12)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sampling Events</CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Calendar className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : stats?.samplings.total_samplings || 0}
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <TrendingUp className="h-3 w-3" />
                  +{stats?.samplings.recent_samplings_30d || 0} (30 hr)
                </span>
                <span>{stats?.data_records.total_water_quality_records || 0} WQ Data</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 3: HABs Events */}
        <Link href="/events/habs" className="group">
          <Card className="h-full transition-all duration-200 group-hover:border-destructive/40 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.12)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kejadian HABs</CardTitle>
              <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                <Activity className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-destructive">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin text-destructive" /> : stats?.habs.total_habs_events || 0}
              </div>
              <div className="mt-2 text-xs flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-destructive/10 text-destructive text-[11px] font-semibold">
                  {(stats?.habs.habs_darurat || 0) + (stats?.habs.habs_siaga || 0)} Siaga / Darurat
                </span>
                <span className="text-muted-foreground text-[11px]">
                  {stats?.habs.active_habs_events || 0} Masih Berlangsung
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 4: Jellyfish Blooms */}
        <Link href="/events/habs" className="group">
          <Card className="h-full transition-all duration-200 group-hover:border-purple-500/40 group-hover:shadow-[0_0_15px_rgba(157,78,221,0.12)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jellyfish Blooms</CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                <Bug className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-purple-600 dark:text-purple-400">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin text-purple-500" /> : stats?.jellyfish.total_jellyfish_events || 0}
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px] font-semibold">
                  {stats?.jellyfish.active_jellyfish_events || 0} Aktif
                </span>
                <span>{stats?.species.jellyfish_species || 0} Spesies Ubur-ubur</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* MAIN CHARTS ROW: TIME-SERIES PARAMETER TRENDS & REGIONAL DISTRIBUTION */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Tren Parameter Kualitas Air (Col 4) */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Droplets className="h-4 w-4 text-primary" />
                Tren Parameter Lingkungan Laut
              </CardTitle>
              <CardDescription>
                Rata-rata berkala parameter pemicu blooming per stasiun monitoring
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={trendParameter} onValueChange={(val) => setTrendParameter(val || "chlorophyll_a_ugl")}>
                <SelectTrigger className="w-[155px] h-8 text-xs">
                  <SelectValue placeholder="Parameter">
                    {(() => {
                      const labels: Record<string, string> = {
                        chlorophyll_a_ugl: "Klorofil-a (µg/L)",
                        temperature_c: "Suhu Laut (°C)",
                        salinity_psu: "Salinitas (psu)",
                        dissolved_oxygen_mgl: "DO (mg/L)",
                        ph: "pH",
                        turbidity_ntu: "Kekeruhan (NTU)",
                      }
                      return labels[trendParameter] || "Parameter"
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chlorophyll_a_ugl">Klorofil-a (µg/L)</SelectItem>
                  <SelectItem value="temperature_c">Suhu Laut (°C)</SelectItem>
                  <SelectItem value="salinity_psu">Salinitas (psu)</SelectItem>
                  <SelectItem value="dissolved_oxygen_mgl">DO (mg/L)</SelectItem>
                  <SelectItem value="ph">pH</SelectItem>
                  <SelectItem value="turbidity_ntu">Kekeruhan (NTU)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={trendStation} onValueChange={(val) => setTrendStation(val || "all")}>
                <SelectTrigger className="w-[155px] h-8 text-xs">
                  <SelectValue placeholder="Semua Stasiun">
                    {trendStation === "all"
                      ? "Semua Stasiun"
                      : stations.find((st) => st.id === trendStation)
                      ? `${stations.find((st) => st.id === trendStation)?.station_code} - ${stations.find((st) => st.id === trendStation)?.name}`
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Stasiun</SelectItem>
                  {stations.map((st) => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.station_code} - {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {trendLoading ? (
              <div className="h-[280px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs">Memuat data tren time-series...</span>
              </div>
            ) : trendData && trendData.xAxisData.length > 0 ? (
              <LineChart
                title=""
                xAxisData={trendData.xAxisData}
                seriesData={trendData.seriesData}
                yAxisLabel={trendData.unit}
              />
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-lg bg-muted/10 text-muted-foreground text-xs">
                <Droplets className="h-8 w-8 mb-2 opacity-40 text-primary" />
                <span>Belum ada data rekaman untuk parameter yang dipilih.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribusi Kejadian Per Wilayah (Col 3) */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Distribusi Kejadian Per Wilayah
            </CardTitle>
            <CardDescription>Jumlah laporan HABs dan Jellyfish Bloom per provinsi</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {eventDistLoading ? (
              <div className="h-[280px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs">Memuat data sebaran kejadian...</span>
              </div>
            ) : eventDistData && eventDistData.by_province.xAxisData.length > 0 ? (
              <BarChart
                title=""
                xAxisData={eventDistData.by_province.xAxisData}
                seriesData={eventDistData.by_province.totalSeries}
                yAxisLabel="Total Kejadian"
              />
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-lg bg-muted/10 text-muted-foreground text-xs">
                <MapPin className="h-8 w-8 mb-2 opacity-40 text-primary" />
                <span>Belum ada laporan kejadian blooming per wilayah.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SECONDARY ROW: STATUS PERINGATAN, TINGKAT KEPARAHAN & SPESIES DOMINAN */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Peringatan Donut Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Distribusi Status Peringatan
            </CardTitle>
            <CardDescription>Proporsi status peringatan seluruh kejadian</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {eventDistLoading ? (
              <div className="h-[240px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : eventDistData && eventDistData.by_alert_status.length > 0 ? (
              <PieChart
                data={eventDistData.by_alert_status.map((item) => {
                  let color = "#118AB2"
                  if (item.label === "Darurat") color = "#EF476F"
                  else if (item.label === "Siaga") color = "#F4A261"
                  else if (item.label === "Waspada") color = "#FFD166"
                  else if (item.label === "Normal") color = "#06D6A0"
                  return {
                    name: `Status ${item.label}`,
                    value: item.total_events,
                    itemStyle: { color },
                  }
                })}
                height="240px"
              />
            ) : (
              <div className="h-[240px] flex items-center justify-center text-xs text-muted-foreground">
                Belum ada data status peringatan
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tingkat Keparahan Donut Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-destructive" />
              Tingkat Keparahan Kejadian
            </CardTitle>
            <CardDescription>Breakdown tingkat dampak ekologis & sosial</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {eventDistLoading ? (
              <div className="h-[240px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : eventDistData && eventDistData.by_severity.length > 0 ? (
              <PieChart
                data={eventDistData.by_severity.map((item) => {
                  let color = "#06D6A0"
                  if (item.label === "kritis") color = "#D90429"
                  else if (item.label === "tinggi") color = "#F77F00"
                  else if (item.label === "sedang") color = "#FCBF49"
                  else if (item.label === "rendah") color = "#2A9D8F"
                  return {
                    name: `Keparahan ${item.label.toUpperCase()}`,
                    value: item.total_events,
                    itemStyle: { color },
                  }
                })}
                height="240px"
              />
            ) : (
              <div className="h-[240px] flex items-center justify-center text-xs text-muted-foreground">
                Belum ada data keparahan kejadian
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Dominant Species */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Spesies Paling Sering Terdeteksi
                </CardTitle>
                <CardDescription>Frekuensi pencatatan taksonomi master</CardDescription>
              </div>
              <Link
                href="/species"
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                Katalog <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {speciesDistLoading ? (
              <div className="h-[240px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : speciesDistData && speciesDistData.top_species.length > 0 ? (
              <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                {speciesDistData.top_species.slice(0, 5).map((sp) => (
                  <div
                    key={sp.species_id}
                    className="p-2.5 rounded-lg border bg-muted/20 flex items-center justify-between text-xs hover:bg-muted/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="italic text-foreground">{sp.scientific_name}</strong>
                        {sp.is_toxic && (
                          <Badge variant="destructive" className="text-[9px] py-0 px-1">
                            Toksik
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {sp.organism_category} {sp.common_name ? `• ${sp.common_name}` : ""}
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-foreground text-xs">{sp.records_count}</span>
                      <span className="text-[10px] text-muted-foreground block">rekaman</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-xs text-muted-foreground">
                Belum ada data spesies terdaftar
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
