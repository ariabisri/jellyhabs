"use client"

import * as React from "react"
import {
  ShieldAlert,
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  RefreshCw,
  MapPin,
  Calendar,
  Users,
  AlertTriangle,
  Loader2,
  Trash2,
  Edit,
  CheckCircle2,
  FileSpreadsheet,
  HeartPulse,
  Activity,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Info,
  Anchor,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

interface StingRecord {
  id: string
  incident_date: string
  incident_time: string | null
  location_name: string
  latitude: number | null
  longitude: number | null
  station_id: string | null
  station_code?: string | null
  station_name?: string | null
  beach_id?: string | null
  beach_master_name?: string | null
  beach_village?: string | null
  beach_subdistrict?: string | null
  beach_sar_post?: string | null
  bloom_event_id: string | null
  bloom_event_code?: string | null
  bloom_event_type?: string | null
  victim_count: number
  victim_name: string | null
  victim_age: string | null
  victim_gender: string | null
  severity_level: string | null
  treatment_notes: string | null
  reported_by: string | null
  reported_by_name?: string | null
  created_at: string
}

interface StatsData {
  summary: {
    total_incidents: number
    total_victims: number
    victims_2026: number
    male_victims: number
    female_victims: number
    unspecified_victims: number
    top_beach: { name: string; victims: number } | null
  }
}

interface BeachOption {
  id: string
  station_id: string
  station_code?: string
  station_name?: string
  name: string
  village?: string | null
  subdistrict?: string | null
  regency?: string | null
  latitude: number
  longitude: number
  sar_post_name?: string | null
  incident_count?: number
  total_victims?: number
}

const COMMON_BEACHES = [
  "Pantai Kukup",
  "Pantai Sepanjang",
  "Pantai Krakal",
  "Pantai Drini",
  "Pantai Pulang Sawal",
  "Pantai Sundak",
  "Pantai Baron",
  "Pantai Watu Kodok",
  "Pantai Sadranan",
  "Pantai Ngrawe",
  "Pantai Ngandong",
  "Pantai Slili",
]

interface StationOption {
  id: string
  station_code: string
  name: string
  city: string
  province: string
}

export default function StingsPage() {
  const { user, authenticated } = useAuth()

  // Stations & Beaches state
  const [stations, setStations] = React.useState<StationOption[]>([])
  const [beaches, setBeaches] = React.useState<BeachOption[]>([])
  const [stationFilter, setStationFilter] = React.useState("all")
  const [importStationId, setImportStationId] = React.useState("")

  // Data states
  const [records, setRecords] = React.useState<StingRecord[]>([])
  const [stats, setStats] = React.useState<StatsData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [statsLoading, setStatsLoading] = React.useState(true)

  // Filters
  const [search, setSearch] = React.useState("")
  const [yearFilter, setYearFilter] = React.useState("all")
  const [monthFilter, setMonthFilter] = React.useState("all")
  const [locationFilter, setLocationFilter] = React.useState("all")
  const [genderFilter, setGenderFilter] = React.useState("all")
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalCount, setTotalCount] = React.useState(0)

  // Dialog States
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isImportOpen, setIsImportOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [selectedRecord, setSelectedRecord] = React.useState<StingRecord | null>(null)

  // Form State
  const [formData, setFormData] = React.useState({
    incident_date: new Date().toISOString().split("T")[0],
    incident_time: "",
    location_name: "Pantai Sepanjang",
    station_id: "",
    beach_id: "",
    victim_count: 1,
    victim_name: "",
    victim_age: "",
    victim_gender: "Laki-laki",
    severity_level: "Ringan - Iritasi Kulit",
    treatment_notes: "Kompres cuka asam asetat 4-6% dan bilas air laut bersih.",
    bloom_event_id: "",
  })
  const [submitting, setSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  // Import State
  const [importFile, setImportFile] = React.useState<File | null>(null)
  const [importing, setImporting] = React.useState(false)
  const [importResult, setImportResult] = React.useState<{ message?: string; count?: number; error?: string } | null>(null)

  // Fetch Stations
  const fetchStations = React.useCallback(async () => {
    try {
      const res = await fetch("/api/stations?status=aktif")
      const json = await res.json()
      if (json.success && json.data) {
        setStations(json.data)
        const st03 = json.data.find((s: StationOption) => s.station_code === "ST-03")
        if (st03) {
          setFormData((prev) => ({ ...prev, station_id: prev.station_id || st03.id }))
          setImportStationId(st03.id)
        }
      }
    } catch (err) {
      console.error("Failed to load stations:", err)
    }
  }, [])

  // Fetch Beaches (filtered by station if selected)
  const fetchBeaches = React.useCallback(async (stationId?: string) => {
    try {
      const url =
        stationId && stationId !== "all"
          ? `/api/beaches?station_id=${stationId}&status=aktif`
          : `/api/beaches?status=aktif`
      const res = await fetch(url)
      const json = await res.json()
      if (json.success && json.data) {
        setBeaches(json.data)
      }
    } catch (err) {
      console.error("Failed to load beaches:", err)
    }
  }, [])

  // Fetch Stats
  const fetchStats = React.useCallback(async () => {
    try {
      setStatsLoading(true)
      const res = await fetch("/api/stings/stats")
      const json = await res.json()
      if (json.success) {
        setStats(json.data)
      }
    } catch (err) {
      console.error("Failed to load stats:", err)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // Fetch Records
  const fetchRecords = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append("page", page.toString())
      params.append("limit", "15")

      if (yearFilter !== "all") params.append("year", yearFilter)
      if (monthFilter !== "all") params.append("month", monthFilter)
      if (locationFilter !== "all") params.append("location", locationFilter)
      if (genderFilter !== "all") params.append("gender", genderFilter)
      if (stationFilter !== "all") params.append("station_id", stationFilter)
      if (search.trim()) params.append("q", search.trim())

      const res = await fetch(`/api/stings?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setRecords(json.data)
        setTotalPages(json.pagination.totalPages || 1)
        setTotalCount(json.pagination.total || 0)
      }
    } catch (err) {
      console.error("Failed to load records:", err)
    } finally {
      setLoading(false)
    }
  }, [page, yearFilter, monthFilter, locationFilter, genderFilter, stationFilter, search])

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search)
      const stParam = sp.get("station_id")
      if (stParam) setStationFilter(stParam)
      const locParam = sp.get("location")
      if (locParam) setLocationFilter(locParam)
    }
    fetchStations()
  }, [fetchStations])

  React.useEffect(() => {
    fetchBeaches(stationFilter)
  }, [fetchBeaches, stationFilter])

  React.useEffect(() => {
    fetchStats()
  }, [fetchStats])

  React.useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  // Handle Form Submit (Add)
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    try {
      const res = await fetch("/api/stings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menyimpan data laporan")
      }

      setIsAddOpen(false)
      fetchRecords()
      fetchStats()
      // Reset form
      const st03 = stations.find((s) => s.station_code === "ST-03")
      setFormData({
        incident_date: new Date().toISOString().split("T")[0],
        incident_time: "",
        location_name: "Pantai Sepanjang",
        station_id: st03?.id || "",
        beach_id: "",
        victim_count: 1,
        victim_name: "",
        victim_age: "",
        victim_gender: "Laki-laki",
        severity_level: "Ringan - Iritasi Kulit",
        treatment_notes: "Kompres cuka asam asetat 4-6% dan bilas air laut bersih.",
        bloom_event_id: "",
      })
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Form Submit (Edit)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRecord) return
    setSubmitting(true)
    setFormError(null)

    try {
      const res = await fetch(`/api/stings/${selectedRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memperbarui data laporan")
      }

      setIsEditOpen(false)
      setSelectedRecord(null)
      fetchRecords()
      fetchStats()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Delete
  const handleDelete = async () => {
    if (!selectedRecord) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/stings/${selectedRecord.id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menghapus data")
      }
      setIsDeleteOpen(false)
      setSelectedRecord(null)
      fetchRecords()
      fetchStats()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Import Submit
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile) return
    setImporting(true)
    setImportResult(null)

    try {
      const fd = new FormData()
      fd.append("file", importFile)
      if (importStationId) {
        fd.append("station_id", importStationId)
      }

      const res = await fetch("/api/stings/import", {
        method: "POST",
        body: fd,
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal mengimpor data file")
      }

      setImportResult({
        message: json.message,
        count: json.data?.inserted_count,
      })
      fetchRecords()
      fetchStats()
    } catch (err: any) {
      setImportResult({ error: err.message })
    } finally {
      setImporting(false)
    }
  }

  const openEditModal = (rec: StingRecord) => {
    setSelectedRecord(rec)
    const st03 = stations.find((s) => s.station_code === "ST-03")
    setFormData({
      incident_date: rec.incident_date ? rec.incident_date.split("T")[0] : "",
      incident_time: rec.incident_time || "",
      location_name: rec.location_name,
      station_id: rec.station_id || st03?.id || "",
      beach_id: rec.beach_id || "",
      victim_count: rec.victim_count,
      victim_name: rec.victim_name || "",
      victim_age: rec.victim_age || "",
      victim_gender: rec.victim_gender || "Laki-laki",
      severity_level: rec.severity_level || "Ringan - Iritasi Kulit",
      treatment_notes: rec.treatment_notes || "",
      bloom_event_id: rec.bloom_event_id || "",
    })
    setFormError(null)
    setIsEditOpen(true)
  }

  const openDeleteModal = (rec: StingRecord) => {
    setSelectedRecord(rec)
    setIsDeleteOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header & Action Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <ShieldAlert className="size-4 text-primary" />
            <span>Monitoring Insiden Sengatan </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Monitoring Korban Sengatan Ubur-Ubur
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pencatatan dan analisis insiden korban sengatan ubur-ubur (*jellyfish stings*) pada kawasan pantai.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/api/stings/export"
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border bg-card/80 text-foreground hover:bg-accent/20 transition-all shadow-sm"
            title="Download seluruh data dalam format CSV"
          >
            <Download className="size-3.5 text-primary" />
            <span>Ekspor CSV</span>
          </a>

          {authenticated && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setImportFile(null)
                  setImportResult(null)
                  setIsImportOpen(true)
                }}
                className="text-xs h-9 gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
              >
                <Upload className="size-3.5" />
                <span>Import Excel / CSV</span>
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  setFormError(null)
                  setIsAddOpen(true)
                }}
                className="text-xs h-9 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
              >
                <Plus className="size-3.5" />
                <span>Tambah Laporan</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card/60 backdrop-blur shadow-sm hover:border-primary/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Korban Terdata</CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <HeartPulse className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {statsLoading ? <Loader2 className="size-5 animate-spin text-primary" /> : stats?.summary.total_victims.toLocaleString() || "0"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Dari total <span className="font-semibold text-foreground">{stats?.summary.total_incidents || 0}</span> entri insiden
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur shadow-sm hover:border-primary/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Korban Tahun Berjalan (2026)</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calendar className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {statsLoading ? <Loader2 className="size-5 animate-spin text-primary" /> : stats?.summary.victims_2026 || "0"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Insiden aktif selama periode muson timur
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur shadow-sm hover:border-primary/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Pantai Terdampak Terbanyak</CardTitle>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
              <MapPin className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground truncate">
              {statsLoading ? <Loader2 className="size-5 animate-spin text-primary" /> : stats?.summary.top_beach?.name || "-"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Akumulasi <span className="font-semibold text-red-500">{stats?.summary.top_beach?.victims || 0} korban</span> sengatan
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur shadow-sm hover:border-primary/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Demografi Jenis Kelamin</CardTitle>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold flex items-center gap-3">
              <span className="text-blue-500 font-bold">
                ♂ {stats?.summary.male_victims || 0} <span className="text-[10px] text-muted-foreground">Laki-laki</span>
              </span>
              <span className="text-pink-500 font-bold">
                ♀ {stats?.summary.female_victims || 0} <span className="text-[10px] text-muted-foreground">Perempuan</span>
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Mayoritas korban adalah anak-anak & wisatawan di bibir pantai
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Context Banner */}
      {stationFilter !== "all" && (
        <div className="flex items-start sm:items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-primary/10 border border-primary/25 text-xs text-foreground">
          <Anchor className="size-4 text-primary shrink-0 mt-0.5 sm:mt-0" />
          <span className="leading-relaxed">
            <strong>Konteks Wilayah:</strong> Menampilkan data insiden sengatan pada pantai-pantai di bawah yurisdiksi pemantauan{" "}
            <strong className="text-primary">{stations.find((s) => s.id === stationFilter)?.name || "Stasiun Pengamatan"}</strong>{" "}
            ({beaches.length} pantai terdata).
          </span>
        </div>
      )}

      {/* Filter Toolbar dengan Judul Kategori Eksplisit */}
      <Card className="border-border bg-card/80 shadow-sm p-4 space-y-3.5">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wide">
            <Filter className="size-3.5 text-primary" />
            <span>Kategori Filter Data</span>
          </div>
          {(stationFilter !== "all" || yearFilter !== "all" || monthFilter !== "all" || locationFilter !== "all" || genderFilter !== "all" || search.trim()) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStationFilter("all")
                setYearFilter("all")
                setMonthFilter("all")
                setLocationFilter("all")
                setGenderFilter("all")
                setSearch("")
                setPage(1)
              }}
              className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
            >
              Reset Filter
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Kategori: Stasiun Pengamatan */}
          <div className="space-y-1.5 lg:col-span-2">
            <Label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <Anchor className="size-3.5 text-primary" />
              <span>Stasiun Pengamatan</span>
            </Label>
            <Select
              value={stationFilter}
              onValueChange={(val) => {
                setStationFilter(val || "all")
                setLocationFilter("all")
                setPage(1)
              }}
            >
              <SelectTrigger className="h-9 text-xs bg-background border-border font-medium">
                <SelectValue placeholder="Pilih Stasiun Pengamatan">
                  {stationFilter === "all"
                    ? "Semua Stasiun Pengamatan"
                    : stations.find((s) => s.id === stationFilter)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#0c1322] border-slate-300 dark:border-slate-700 text-foreground shadow-2xl z-[70]">
                <SelectItem value="all">Semua Stasiun Pengamatan</SelectItem>
                {stations.map((st) => (
                  <SelectItem key={st.id} value={st.id}>
                    {st.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kategori: Tahun Kejadian */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="size-3.5 text-primary" />
              <span>Tahun Kejadian</span>
            </Label>
            <Select
              value={yearFilter}
              onValueChange={(val) => {
                setYearFilter(val || "all")
                setPage(1)
              }}
            >
              <SelectTrigger className="h-9 text-xs bg-background border-border">
                <SelectValue placeholder="Pilih Tahun" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#0c1322] border-slate-300 dark:border-slate-700 text-foreground shadow-2xl z-[70]">
                <SelectItem value="all">Semua Tahun</SelectItem>
                <SelectItem value="2026">Tahun 2026</SelectItem>
                <SelectItem value="2025">Tahun 2025</SelectItem>
                <SelectItem value="2024">Tahun 2024</SelectItem>
                <SelectItem value="2023">Tahun 2023</SelectItem>
                <SelectItem value="2022">Tahun 2022</SelectItem>
                <SelectItem value="2021">Tahun 2021</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Kategori: Bulan Kejadian */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="size-3.5 text-primary" />
              <span>Bulan Kejadian</span>
            </Label>
            <Select
              value={monthFilter}
              onValueChange={(val) => {
                setMonthFilter(val || "all")
                setPage(1)
              }}
            >
              <SelectTrigger className="h-9 text-xs bg-background border-border">
                <SelectValue placeholder="Pilih Bulan" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#0c1322] border-slate-300 dark:border-slate-700 text-foreground shadow-2xl z-[70]">
                <SelectItem value="all">Semua Bulan</SelectItem>
                <SelectItem value="5">Mei</SelectItem>
                <SelectItem value="6">Juni</SelectItem>
                <SelectItem value="7">Juli (Musim Puncak)</SelectItem>
                <SelectItem value="8">Agustus</SelectItem>
                <SelectItem value="9">September</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Kategori: Nama Pantai */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary" />
              <span>Nama Pantai</span>
            </Label>
            <Select
              value={locationFilter}
              onValueChange={(val) => {
                setLocationFilter(val || "all")
                setPage(1)
              }}
            >
              <SelectTrigger className="h-9 text-xs bg-background border-border truncate">
                <SelectValue placeholder="Pilih Pantai" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#0c1322] border-slate-300 dark:border-slate-700 text-foreground shadow-2xl z-[70]">
                <SelectItem value="all">Semua Pantai</SelectItem>
                {beaches.length > 0
                  ? beaches.map((b) => (
                    <SelectItem key={b.id} value={b.name}>
                      {b.name}
                    </SelectItem>
                  ))
                  : COMMON_BEACHES.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kategori: Pencarian Kata Kunci */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <Search className="size-3.5 text-primary" />
              <span>Pencarian Kata Kunci</span>
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Korban / catatan..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-8 bg-background text-xs h-9 border-border"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Data Table */}
      <Card className="border-border bg-card/60 backdrop-blur shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-12 text-center text-xs font-semibold">No</TableHead>
                <TableHead className="text-xs font-semibold">Tanggal & Waktu</TableHead>
                <TableHead className="text-xs font-semibold">Lokasi Pantai & Stasiun</TableHead>
                <TableHead className="text-xs font-semibold text-center">Korban</TableHead>
                <TableHead className="text-xs font-semibold">Identitas (Nama / Usia)</TableHead>
                <TableHead className="text-xs font-semibold">Gender</TableHead>
                <TableHead className="text-xs font-semibold">Gejala & Penanganan</TableHead>
                <TableHead className="text-xs font-semibold">Kaitan Event</TableHead>
                {authenticated && <TableHead className="text-xs font-semibold text-right w-24">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={authenticated ? 9 : 8} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="size-6 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">Memuat data korban sengatan...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={authenticated ? 9 : 8} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldAlert className="size-8 text-muted-foreground/50" />
                      <span className="text-sm font-medium text-foreground">Tidak ada data ditemukan</span>
                      <span className="text-xs text-muted-foreground">Coba ubah filter pencarian Anda</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                records.map((rec, idx) => {
                  const dateFormatted = rec.incident_date
                    ? new Date(rec.incident_date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                    : "-"

                  return (
                    <TableRow key={rec.id} className="border-border/40 hover:bg-muted/30 transition-colors">
                      <TableCell className="text-center text-xs text-muted-foreground font-mono">
                        {(page - 1) * 15 + idx + 1}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium text-foreground flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-primary/70 inline" />
                          <span>{dateFormatted}</span>
                        </div>
                        {rec.incident_time && (
                          <div className="text-[11px] text-muted-foreground">{rec.incident_time} WIB</div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-red-500 inline shrink-0" />
                          <span>{rec.location_name}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                          <Anchor className="size-3 shrink-0 text-primary" />
                          <span>{rec.station_name || "Stasiun Monitoring"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-bold px-2 py-0.5",
                            rec.victim_count > 5
                              ? "bg-red-500/10 text-red-500 border-red-500/30"
                              : rec.victim_count > 1
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                : "bg-primary/10 text-primary border-primary/30"
                          )}
                        >
                          {rec.victim_count} orang
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium text-foreground">
                          {rec.victim_name && rec.victim_name !== "-" ? rec.victim_name : <span className="text-muted-foreground italic">Anonim</span>}
                        </div>
                        {rec.victim_age && rec.victim_age !== "-" && (
                          <div className="text-[11px] text-muted-foreground">{rec.victim_age}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {rec.victim_gender === "Laki-laki" ? (
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[11px]">
                            Laki-laki
                          </Badge>
                        ) : rec.victim_gender === "Perempuan" ? (
                          <Badge variant="secondary" className="bg-pink-500/10 text-pink-500 border-pink-500/20 text-[11px]">
                            Perempuan
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs max-w-xs">
                        <div className="font-medium text-foreground truncate" title={rec.severity_level || ""}>
                          {rec.severity_level || "Gejala Iritasi"}
                        </div>
                        {rec.treatment_notes && (
                          <div className="text-[11px] text-muted-foreground truncate mt-0.5" title={rec.treatment_notes}>
                            {rec.treatment_notes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {rec.bloom_event_code ? (
                          <Badge variant="outline" className="bg-accent-violet/10 text-accent-violet border-accent-violet/30 text-[10px]">
                            <Activity className="size-2.5 mr-1" />
                            {rec.bloom_event_code}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">-</span>
                        )}
                      </TableCell>
                      {authenticated && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-foreground"
                              onClick={() => openEditModal(rec)}
                              title="Edit Data"
                            >
                              <Edit className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive hover:bg-destructive/10"
                              onClick={() => openDeleteModal(rec)}
                              title="Hapus Data"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/60 bg-card/40 text-xs">
          <span className="text-muted-foreground">
            Menampilkan <span className="font-semibold text-foreground">{records.length}</span> dari{" "}
            <span className="font-semibold text-foreground">{totalCount}</span> insiden
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2 text-xs"
            >
              <ChevronLeft className="size-3.5 mr-1" />
              Sebelumnya
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              Halaman <span className="font-semibold text-foreground">{page}</span> / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2 text-xs"
            >
              Berikutnya
              <ChevronRight className="size-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Dialog: Tambah Laporan Manual */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-xl bg-white dark:bg-[#0c1322] border-2 border-primary/20 dark:border-primary/30 shadow-2xl z-50 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Plus className="size-5 text-primary" />
              <span>Catat Insiden Korban Sengatan</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Formulir input pencatatan insiden korban sengatan ubur-ubur di wilayah stasiun pengamatan.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/25 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleAddSubmit} className="space-y-3.5 py-1">
            {/* Stasiun Pengamatan & Konteks Wilayah */}
            <div className="space-y-1.5 p-3 rounded-lg bg-primary/5 dark:bg-primary/[0.04] border border-primary/20">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold flex items-center gap-1.5 text-primary">
                  <Anchor className="size-3.5" />
                  <span>Stasiun Pengamatan Laut *</span>
                </Label>
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 font-mono">
                  Wilayah Pesisir
                </Badge>
              </div>
              <Select
                value={formData.station_id}
                onValueChange={(val) => {
                  const targetStationId = val || ""
                  const stationBeaches = beaches.filter((b) => b.station_id === targetStationId)
                  setFormData({
                    ...formData,
                    station_id: targetStationId,
                    location_name: stationBeaches[0]?.name || formData.location_name,
                    beach_id: stationBeaches[0]?.id || "",
                  })
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-[#162032] border-slate-300 dark:border-slate-700 text-foreground font-semibold">
                  <SelectValue placeholder="Pilih Stasiun Pengamatan">
                    {stations.find((s) => s.id === formData.station_id)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#0c1322] border-slate-300 dark:border-slate-700 text-foreground shadow-2xl z-[70]">
                  {stations.map((st) => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Info className="size-3 text-primary shrink-0" />
                <span>Pantai tempat terjadinya sengatan berada di dalam area pemantauan stasiun ini.</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Tanggal Kejadian *</Label>
                <Input
                  type="date"
                  required
                  value={formData.incident_date}
                  onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                  className="h-9 text-xs bg-slate-50 dark:bg-[#162032] border-slate-300 dark:border-slate-700 text-foreground focus:bg-white dark:focus:bg-[#162032]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Jam Kejadian (WIB)</Label>
                <Input
                  type="time"
                  value={formData.incident_time}
                  onChange={(e) => setFormData({ ...formData, incident_time: e.target.value })}
                  className="h-9 text-xs bg-slate-50 dark:bg-[#162032] border-slate-300 dark:border-slate-700 text-foreground focus:bg-white dark:focus:bg-[#162032]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Lokasi Pantai *</Label>
                <Select
                  value={formData.location_name}
                  onValueChange={(val) => {
                    const matched = beaches.find((b) => b.name === val)
                    setFormData({
                      ...formData,
                      location_name: val || "",
                      beach_id: matched?.id || "",
                    })
                  }}
                >
                  <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-[#162032] border-slate-300 dark:border-slate-700 text-foreground font-medium truncate">
                    <SelectValue placeholder="Pilih Pantai" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#0c1322] border-slate-300 dark:border-slate-700 text-foreground shadow-2xl z-[70]">
                    {(beaches.filter((b) => !formData.station_id || b.station_id === formData.station_id).length > 0
                      ? beaches.filter((b) => !formData.station_id || b.station_id === formData.station_id)
                      : beaches
                    ).map((b) => (
                      <SelectItem key={b.id} value={b.name}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Jumlah Korban *</Label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={formData.victim_count}
                  onChange={(e) => setFormData({ ...formData, victim_count: parseInt(e.target.value, 10) || 1 })}
                  className="h-9 text-xs bg-slate-50 dark:bg-[#162032] border-slate-300 dark:border-slate-700 text-foreground focus:bg-white dark:focus:bg-[#162032]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Nama Korban</Label>
                <Input
                  placeholder="Misal: Rian"
                  value={formData.victim_name}
                  onChange={(e) => setFormData({ ...formData, victim_name: e.target.value })}
                  className="h-9 text-xs bg-slate-50 dark:bg-[#162032] border-slate-300 dark:border-slate-700 text-foreground focus:bg-white dark:focus:bg-[#162032] placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Usia Korban</Label>
                <Input
                  placeholder="Misal: 9 tahun"
                  value={formData.victim_age}
                  onChange={(e) => setFormData({ ...formData, victim_age: e.target.value })}
                  className="h-9 text-xs bg-slate-50 dark:bg-[#162032] border-slate-300 dark:border-slate-700 text-foreground focus:bg-white dark:focus:bg-[#162032] placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Jenis Kelamin</Label>
                <Select
                  value={formData.victim_gender}
                  onValueChange={(val) => setFormData({ ...formData, victim_gender: val || "Laki-laki" })}
                >
                  <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-[#162032] border-slate-300 dark:border-slate-700 text-foreground font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#0c1322] border-slate-300 dark:border-slate-700 text-foreground shadow-2xl z-[70]">
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Tingkat Keparahan / Gejala</Label>
              <Input
                placeholder="Misal: Ringan - Iritasi Kulit & Rasa Terbakar"
                value={formData.severity_level}
                onChange={(e) => setFormData({ ...formData, severity_level: e.target.value })}
                className="h-9 text-xs bg-slate-50 dark:bg-[#162032] border-slate-300 dark:border-slate-700 text-foreground focus:bg-white dark:focus:bg-[#162032] placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Catatan Penanganan Medis</Label>
              <Input
                placeholder="Tindakan pertolongan pertama yang diberikan"
                value={formData.treatment_notes}
                onChange={(e) => setFormData({ ...formData, treatment_notes: e.target.value })}
                className="h-9 text-xs bg-slate-50 dark:bg-[#162032] border-slate-300 dark:border-slate-700 text-foreground focus:bg-white dark:focus:bg-[#162032] placeholder:text-muted-foreground"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)} className="text-xs">
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="text-xs bg-primary text-primary-foreground font-semibold">
                {submitting ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <CheckCircle2 className="size-3.5 mr-1" />}
                <span>Simpan Laporan</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit Laporan */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl bg-white dark:bg-[#0c1322] border-2 border-primary/20 dark:border-primary/30 shadow-2xl z-50 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Edit className="size-5 text-primary" />
              <span>Edit Laporan Sengatan</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Perbarui data insiden korban sengatan ubur-ubur pada wilayah stasiun pengamatan.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/25 text-destructive text-xs">
              {formError}
            </div>
          )}

          <form onSubmit={handleEditSubmit} className="space-y-3.5 py-1">
            {/* Stasiun Pengamatan Selector */}
            <div className="space-y-1.5 p-3 rounded-lg bg-primary/5 dark:bg-primary/[0.04] border border-primary/20">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold flex items-center gap-1.5 text-primary">
                  <Anchor className="size-3.5" />
                  <span>Stasiun Pengamatan Laut *</span>
                </Label>
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 font-mono">
                  Wilayah Pesisir
                </Badge>
              </div>
              <Select
                value={formData.station_id}
                onValueChange={(val) => {
                  const targetStationId = val || ""
                  const stationBeaches = beaches.filter((b) => b.station_id === targetStationId)
                  setFormData({
                    ...formData,
                    station_id: targetStationId,
                    location_name: stationBeaches[0]?.name || formData.location_name,
                    beach_id: stationBeaches[0]?.id || "",
                  })
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-[#162032] border-slate-300 dark:border-slate-700 text-foreground font-semibold">
                  <SelectValue placeholder="Pilih Stasiun Pengamatan">
                    {stations.find((s) => s.id === formData.station_id)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#0c1322] border-slate-300 dark:border-slate-700 text-foreground shadow-2xl z-[70]">
                  {stations.map((st) => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Tanggal Kejadian *</Label>
                <Input
                  type="date"
                  required
                  value={formData.incident_date}
                  onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                  className="h-9 text-xs bg-slate-50 dark:bg-[#162032] border-slate-300 dark:border-slate-700 text-foreground focus:bg-white dark:focus:bg-[#162032]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Jam Kejadian</Label>
                <Input
                  type="time"
                  value={formData.incident_time}
                  onChange={(e) => setFormData({ ...formData, incident_time: e.target.value })}
                  className="h-9 text-xs bg-slate-50 dark:bg-[#162032] border-slate-300 dark:border-slate-700 text-foreground focus:bg-white dark:focus:bg-[#162032]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Lokasi Pantai *</Label>
                <Select
                  value={formData.location_name}
                  onValueChange={(val) => {
                    const matched = beaches.find((b) => b.name === val)
                    setFormData({
                      ...formData,
                      location_name: val || "",
                      beach_id: matched?.id || "",
                    })
                  }}
                >
                  <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-[#162032] border-slate-300 dark:border-slate-700 text-foreground font-medium truncate">
                    <SelectValue placeholder="Pilih Pantai" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#0c1322] border-slate-300 dark:border-slate-700 text-foreground shadow-2xl z-[70]">
                    {(beaches.filter((b) => !formData.station_id || b.station_id === formData.station_id).length > 0
                      ? beaches.filter((b) => !formData.station_id || b.station_id === formData.station_id)
                      : beaches
                    ).map((b) => (
                      <SelectItem key={b.id} value={b.name}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Jumlah Korban</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.victim_count}
                  onChange={(e) => setFormData({ ...formData, victim_count: parseInt(e.target.value, 10) || 1 })}
                  className="h-9 text-xs bg-slate-50 dark:bg-[#162032] border-slate-300 dark:border-slate-700 text-foreground focus:bg-white dark:focus:bg-[#162032]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Nama Korban</Label>
                <Input
                  value={formData.victim_name}
                  onChange={(e) => setFormData({ ...formData, victim_name: e.target.value })}
                  className="h-9 text-xs bg-slate-50 dark:bg-[#162032] border-slate-300 dark:border-slate-700 text-foreground focus:bg-white dark:focus:bg-[#162032]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Usia Korban</Label>
                <Input
                  value={formData.victim_age}
                  onChange={(e) => setFormData({ ...formData, victim_age: e.target.value })}
                  className="h-9 text-xs bg-slate-50 dark:bg-[#162032] border-slate-300 dark:border-slate-700 text-foreground focus:bg-white dark:focus:bg-[#162032]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Gender</Label>
                <Select
                  value={formData.victim_gender}
                  onValueChange={(val) => setFormData({ ...formData, victim_gender: val || "Laki-laki" })}
                >
                  <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-[#162032] border-slate-300 dark:border-slate-700 text-foreground font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#0c1322] border-slate-300 dark:border-slate-700 text-foreground shadow-2xl z-[70]">
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Gejala / Keparahan</Label>
              <Input
                value={formData.severity_level}
                onChange={(e) => setFormData({ ...formData, severity_level: e.target.value })}
                className="h-9 text-xs bg-slate-50 dark:bg-[#162032] border-slate-300 dark:border-slate-700 text-foreground focus:bg-white dark:focus:bg-[#162032]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Catatan Penanganan</Label>
              <Input
                value={formData.treatment_notes}
                onChange={(e) => setFormData({ ...formData, treatment_notes: e.target.value })}
                className="h-9 text-xs bg-slate-50 dark:bg-[#162032] border-slate-300 dark:border-slate-700 text-foreground focus:bg-white dark:focus:bg-[#162032]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)} className="text-xs">
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="text-xs bg-primary text-primary-foreground font-semibold">
                {submitting ? <Loader2 className="size-3.5 animate-spin mr-1" /> : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Delete Confirm */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-[#0c1322] border border-border shadow-2xl z-50 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-bold">
              <AlertTriangle className="size-5" />
              <span>Konfirmasi Hapus Data</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Apakah Anda yakin ingin menghapus catatan insiden di{" "}
              <span className="font-semibold text-foreground">{selectedRecord?.location_name}</span> pada tanggal{" "}
              <span className="font-semibold text-foreground">{selectedRecord?.incident_date?.split("T")[0]}</span>?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)} className="text-xs">
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={submitting}
              onClick={handleDelete}
              className="text-xs"
            >
              {submitting ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Trash2 className="size-3.5 mr-1" />}
              Ya, Hapus Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Import Excel/CSV */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-[#0c1322] border-2 border-primary/20 dark:border-primary/30 shadow-2xl z-50 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <FileSpreadsheet className="size-5 text-primary" />
              <span>Import Data Korban Sengatan</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Unggah file spreadsheet Excel (.xlsx, .xls) atau .csv sesuai format database laporan korban sengatan ubur-ubur.
            </DialogDescription>
          </DialogHeader>

          {/* Template Download Guide Banner */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-foreground flex items-start gap-2.5">
            <Info className="size-4 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <p className="font-semibold text-xs text-primary">Panduan & Template Format Spreadsheet:</p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Gunakan template resmi untuk format laporan insiden korban sengatan per tahun (No, Tanggal, Bulan, Lokasi, Jumlah Korban, dll).
              </p>
              <a
                href="/api/stings/template"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                <Download className="size-3.5" />
                Unduh Template Excel Resmi (.xlsx)
              </a>
            </div>
          </div>

          {importResult?.error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/25 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{importResult.error}</span>
            </div>
          )}

          {importResult?.message && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{importResult.message}</span>
            </div>
          )}

          <form onSubmit={handleImportSubmit} className="space-y-4 py-2">
            {/* Target Stasiun Pengamatan Selector */}
            <div className="space-y-1.5 p-3 rounded-lg bg-primary/5 dark:bg-primary/[0.04] border border-primary/20">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold flex items-center gap-1.5 text-primary">
                  <Anchor className="size-3.5" />
                  <span>Target Stasiun Pengamatan Laut</span>
                </Label>
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 font-medium">
                  {stations.find((s) => s.id === importStationId)?.name || "Stasiun Terpilih"}
                </Badge>
              </div>
              <Select
                value={importStationId}
                onValueChange={(val) => setImportStationId(val || "")}
              >
                <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-[#162032] border-slate-300 dark:border-slate-700 text-foreground font-semibold">
                  <SelectValue placeholder="Pilih Stasiun Pengamatan Target">
                    {stations.find((s) => s.id === importStationId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#0c1322] border-slate-300 dark:border-slate-700 text-foreground shadow-2xl z-[70]">
                  {stations.map((st) => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Seluruh data baris korban sengatan dari spreadsheet akan diasosiasikan dengan area stasiun pengamatan ini.
              </p>
            </div>

            <div className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl p-6 text-center transition-colors bg-slate-50/50 dark:bg-[#162032]/40">
              <Upload className="size-8 text-muted-foreground mx-auto mb-2" />
              <div className="text-xs font-semibold text-foreground mb-1">
                {importFile ? importFile.name : "Pilih atau Seret Berkas ke Sini"}
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">
                Mendukung file .xlsx, .xls, atau .csv (Maksimal 10 MB)
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                id="excel-upload"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null
                  setImportFile(f)
                  setImportResult(null)
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs bg-background border-border"
                onClick={() => document.getElementById("excel-upload")?.click()}
              >
                Pilih Berkas Komputer
              </Button>
            </div>

            <div className="rounded-lg bg-slate-100 dark:bg-[#162032] p-3 text-[11px] text-muted-foreground space-y-1 border border-border/40">
              <div className="font-semibold text-foreground flex items-center gap-1">
                <Info className="size-3.5 text-primary inline" />
                Format Kolom Spreadsheet yang Didukung:
              </div>
              <p>
                Header kolom harus memuat: <code className="text-primary font-mono">Bulan Kejadian</code>,{" "}
                <code className="text-primary font-mono">Tanggal Kejadian</code>,{" "}
                <code className="text-primary font-mono">Lokasi Pantai</code>, dan{" "}
                <code className="text-primary font-mono">Jumlah Korban</code>.
              </p>
              <p>
                Kolom opsional: <code className="text-primary font-mono">Nama Korban</code>,{" "}
                <code className="text-primary font-mono">Umur</code>,{" "}
                <code className="text-primary font-mono">Jenis Kelamin</code>.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsImportOpen(false)} className="text-xs">
                Tutup
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!importFile || importing}
                className="text-xs bg-primary text-primary-foreground font-semibold"
              >
                {importing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1" />
                    Memproses Import...
                  </>
                ) : (
                  <>
                    <Upload className="size-3.5 mr-1" />
                    Mulai Import
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
