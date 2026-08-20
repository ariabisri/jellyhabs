"use client"

import * as React from "react"
import Link from "next/link"
import { use } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Anchor,
  ArrowLeft,
  Bug,
  Calendar,
  ChevronRight,
  Droplets,
  Edit,
  MapPin,
  AlertTriangle,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

interface SamplingEvent {
  id: string
  sampling_code: string
  sampling_date: string
  sampling_time: string | null
  weather_condition: string | null
  field_notes: string | null
  recorded_by_name: string | null
  water_quality_count: number
  plankton_count: number
}

interface WaterQualityRecord {
  id: string
  record_code: string
  sampling_event_id: string
  sampling_code: string
  sampling_date: string
  temperature_c: number | string
  salinity_psu: number | string
  dissolved_oxygen_mgl: number | string
  ph: number | string
  chlorophyll_a_ugl: number | string
  turbidity_ntu?: number | string | null
  notes?: string | null
}

interface PlanktonRecord {
  id: string
  record_code: string
  sampling_event_id: string
  sampling_code: string
  sampling_date: string
  species_id: string
  species_code: string
  scientific_name: string
  common_name: string | null
  organism_category: string
  is_toxic: boolean
  density_value: number | string
  density_unit: string
  toxicity_status: string | null
  morphological_notes: string | null
}

interface BloomEventRecord {
  id: string
  event_code: string
  event_start_date: string
  event_end_date: string | null
  event_type: string
  severity_level: string
  alert_status: string
  description: string | null
  reporter_name: string | null
}

interface StationDetail {
  id: string
  station_code: string
  name: string
  province: string
  city: string
  latitude: number
  longitude: number
  description: string | null
  status: "aktif" | "nonaktif"
  created_at: string
  updated_at: string
  sampling_events: SamplingEvent[]
  water_quality_records: WaterQualityRecord[]
  plankton_records: PlanktonRecord[]
  bloom_events: BloomEventRecord[]
  counts: {
    sampling_count: number
    water_quality_count: number
    plankton_count: number
    bloom_events_count: number
  }
}

type TabKey = "info" | "water-quality" | "plankton" | "sampling" | "bloom-events"

export default function StationDetailPage({
  params,
}: {
  params: Promise<{ stationId: string }>
}) {
  const { stationId } = use(params)
  const { authenticated } = useAuth()

  const [activeTab, setActiveTab] = React.useState<TabKey>("info")
  const [station, setStation] = React.useState<StationDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [notFound, setNotFound] = React.useState(false)

  // Edit Modal State
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [formData, setFormData] = React.useState({
    station_code: "",
    name: "",
    province: "",
    city: "",
    latitude: "",
    longitude: "",
    description: "",
    status: "aktif" as "aktif" | "nonaktif",
  })
  const [formSubmitting, setFormSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  // Notification Toast
  const [banner, setBanner] = React.useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  const showBanner = (type: "success" | "error", message: string) => {
    setBanner({ type, message })
    setTimeout(() => {
      setBanner((prev) => (prev?.message === message ? null : prev))
    }, 4000)
  }

  const fetchStationDetail = React.useCallback(async () => {
    try {
      setLoading(true)
      setNotFound(false)
      const res = await fetch(`/api/stations/${stationId}`)
      const data = await res.json()

      if (res.status === 404 || !data.success) {
        setNotFound(true)
        setStation(null)
      } else {
        setStation(data.data)
      }
    } catch (err) {
      console.error("Error fetching station detail:", err)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [stationId])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchStationDetail()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchStationDetail])

  const handleOpenEdit = () => {
    if (!station) return
    setFormData({
      station_code: station.station_code,
      name: station.name,
      province: station.province,
      city: station.city,
      latitude: station.latitude.toString(),
      longitude: station.longitude.toString(),
      description: station.description || "",
      status: station.status,
    })
    setFormError(null)
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!station) return
    setFormError(null)

    const lat = parseFloat(formData.latitude)
    const lng = parseFloat(formData.longitude)

    if (isNaN(lat) || isNaN(lng)) {
      setFormError("Latitude dan Longitude harus berupa angka valid")
      return
    }

    setFormSubmitting(true)

    try {
      const res = await fetch(`/api/stations/${station.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          station_code: formData.station_code.trim(),
          name: formData.name.trim(),
          province: formData.province.trim(),
          city: formData.city.trim(),
          latitude: lat,
          longitude: lng,
          description: formData.description.trim(),
          status: formData.status,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setFormError(data.error || "Gagal memperbarui data stasiun")
        setFormSubmitting(false)
        return
      }

      setIsEditDialogOpen(false)
      showBanner("success", "Data stasiun monitoring berhasil diperbarui")
      fetchStationDetail()
    } catch (err) {
      console.error("Error editing station:", err)
      setFormError("Terjadi kesalahan jaringan saat menyimpan stasiun")
    } finally {
      setFormSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Memuat informasi stasiun...</p>
      </div>
    )
  }

  if (notFound || !station) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Anchor className="h-12 w-12 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-muted-foreground">
          Stasiun tidak ditemukan
        </h2>
        <p className="text-sm text-muted-foreground">
          Stasiun dengan kode &ldquo;{stationId}&rdquo; tidak ada dalam sistem.
        </p>
        <Link href="/monitoring/stations">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Stasiun
          </Button>
        </Link>
      </div>
    )
  }

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "info", label: "Info Stasiun" },
    {
      key: "water-quality",
      label: "Kualitas Air",
      count: station.water_quality_records.length,
    },
    {
      key: "plankton",
      label: "Plankton & Ubur-ubur",
      count: station.plankton_records.length,
    },
    {
      key: "sampling",
      label: "Sampling Event",
      count: station.sampling_events.length,
    },
    {
      key: "bloom-events",
      label: "Kejadian Blooming",
      count: station.bloom_events.length,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Toast Banner */}
      {banner && (
        <div
          className={cn(
            "p-3 text-sm rounded-lg flex items-center gap-2 border transition-all animate-in fade-in",
            banner.type === "success"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-destructive/10 text-destructive border-destructive/20"
          )}
        >
          {banner.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span className="font-medium">{banner.message}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Monitoring</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href="/monitoring/stations"
          className="hover:text-primary transition-colors flex items-center gap-1"
        >
          <Anchor className="h-3.5 w-3.5" />
          Stasiun Monitoring
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground">{station.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-accent-violet text-primary-foreground shadow-md">
            <Anchor className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{station.name}</h1>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs capitalize font-medium",
                  station.status === "aktif"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {station.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <MapPin className="h-3.5 w-3.5" />
              {station.city}, {station.province} &mdash;
              <span className="font-mono text-xs">
                {Number(station.latitude).toFixed(4)}, {Number(station.longitude).toFixed(4)}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/monitoring/stations">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          </Link>
          {authenticated && (
            <Button size="sm" onClick={handleOpenEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Stasiun
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-all relative shrink-0 ${
              activeTab === tab.key
                ? "text-primary border-b-2 border-primary -mb-px font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Info */}
      {activeTab === "info" && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Kode Stasiun
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono text-primary">
                {station.station_code}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Sampling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{station.sampling_events.length}</p>
              <p className="text-xs text-muted-foreground">kegiatan tercatat</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Data Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium">
                  <Droplets className="h-3 w-3" />
                  {station.water_quality_records.length} WQ
                </span>
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
                  <Bug className="h-3 w-3" />
                  {station.plankton_records.length} PLK
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Kejadian Blooming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {station.bloom_events.length}
              </p>
              <p className="text-xs text-muted-foreground">kejadian tercatat</p>
            </CardContent>
          </Card>

          {/* Description Section */}
          <Card className="md:col-span-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Deskripsi & Catatan Stasiun</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {station.description || "Tidak ada deskripsi atau catatan khusus untuk stasiun pemantauan ini."}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Water Quality */}
      {activeTab === "water-quality" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-primary" />
              Data Kualitas Air &mdash; {station.name}
            </CardTitle>
            <CardDescription>
              Parameter fisik-kimia lingkungan perairan yang tercatat di stasiun ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {station.water_quality_records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Droplets className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">Belum ada data kualitas air</p>
                <p className="text-xs mt-1">Data akan tercatat saat sampling dilakukan di stasiun ini.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Rekord</TableHead>
                    <TableHead>Kode Sampling</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Suhu (°C)</TableHead>
                    <TableHead>Salinitas (PSU)</TableHead>
                    <TableHead>DO (mg/L)</TableHead>
                    <TableHead>pH</TableHead>
                    <TableHead>Klorofil-a (µg/L)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {station.water_quality_records.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono font-medium">{r.record_code}</TableCell>
                      <TableCell className="font-mono text-xs">{r.sampling_code}</TableCell>
                      <TableCell>{r.sampling_date}</TableCell>
                      <TableCell>{r.temperature_c ?? "-"}</TableCell>
                      <TableCell>{r.salinity_psu ?? "-"}</TableCell>
                      <TableCell>{r.dissolved_oxygen_mgl ?? "-"}</TableCell>
                      <TableCell>{r.ph ?? "-"}</TableCell>
                      <TableCell
                        className={
                          Number(r.chlorophyll_a_ugl) > 20
                            ? "text-rose-600 dark:text-rose-400 font-bold"
                            : ""
                        }
                      >
                        {r.chlorophyll_a_ugl ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Plankton */}
      {activeTab === "plankton" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" />
              Data Plankton & Ubur-ubur &mdash; {station.name}
            </CardTitle>
            <CardDescription>
              Spesies plankton dan kelimpahan yang tercatat dari sampling di stasiun ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {station.plankton_records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bug className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">Belum ada data plankton & ubur-ubur</p>
                <p className="text-xs mt-1">Data akan tercatat saat sampling dilakukan di stasiun ini.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Spesies Ilmiah</TableHead>
                    <TableHead>Kepadatan</TableHead>
                    <TableHead>Toksisitas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {station.plankton_records.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono font-medium">{r.record_code}</TableCell>
                      <TableCell>{r.organism_category}</TableCell>
                      <TableCell className="italic font-medium">{r.scientific_name}</TableCell>
                      <TableCell>
                        {Number(r.density_value).toLocaleString("id-ID")} {r.density_unit}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            r.toxicity_status === "Beracun"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {r.toxicity_status || "Tidak"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Sampling */}
      {activeTab === "sampling" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Sampling Event &mdash; {station.name}
            </CardTitle>
            <CardDescription>
              Riwayat dan jadwal kegiatan pengambilan sampel lapangan di stasiun ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {station.sampling_events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Calendar className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">Belum ada sampling event</p>
                <p className="text-xs mt-1">Kegiatan sampling belum tercatat di stasiun ini.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Sampling</TableHead>
                    <TableHead>Tanggal & Waktu</TableHead>
                    <TableHead>Cuaca</TableHead>
                    <TableHead>PJ Lapangan</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {station.sampling_events.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono font-medium">{s.sampling_code}</TableCell>
                      <TableCell>
                        {s.sampling_date} {s.sampling_time ? `(${s.sampling_time})` : ""}
                      </TableCell>
                      <TableCell>{s.weather_condition || "-"}</TableCell>
                      <TableCell>{s.recorded_by_name || "-"}</TableCell>
                      <TableCell className="max-w-[300px] truncate text-muted-foreground">
                        {s.field_notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Bloom Events */}
      {activeTab === "bloom-events" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              Kejadian Blooming &mdash; {station.name}
            </CardTitle>
            <CardDescription>
              Riwayat kejadian HABs dan blooming ubur-ubur berbahaya di lokasi ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {station.bloom_events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <AlertTriangle className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">Tidak ada riwayat kejadian blooming</p>
                <p className="text-xs mt-1">Belum ada fenomena blooming alga atau ubur-ubur di stasiun ini.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Jenis Kejadian</TableHead>
                    <TableHead>Rentang Waktu</TableHead>
                    <TableHead>Tingkat Keparahan</TableHead>
                    <TableHead>Status Peringatan</TableHead>
                    <TableHead>Pelapor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {station.bloom_events.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono font-medium">{e.event_code}</TableCell>
                      <TableCell>{e.event_type}</TableCell>
                      <TableCell className="text-xs">
                        {e.event_start_date} {e.event_end_date ? `s.d. ${e.event_end_date}` : "(Berlangsung)"}
                      </TableCell>
                      <TableCell className="capitalize">{e.severity_level}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-semibold",
                            e.alert_status === "Darurat"
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                              : e.alert_status === "Siaga"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                              : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                          )}
                        >
                          {e.alert_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{e.reporter_name || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Station Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Stasiun Monitoring</DialogTitle>
              <DialogDescription>
                Ubah informasi stasiun pemantauan pesisir di bawah ini.
              </DialogDescription>
            </DialogHeader>

            {formError && (
              <div className="p-3 my-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit_station_code">Kode Stasiun *</Label>
                  <Input
                    id="edit_station_code"
                    value={formData.station_code}
                    onChange={(e) =>
                      setFormData({ ...formData, station_code: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit_status">Status Operasional *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) =>
                      setFormData({
                        ...formData,
                        status: (val as "aktif" | "nonaktif") || "aktif",
                      })
                    }
                  >
                    <SelectTrigger id="edit_status">
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aktif">Aktif</SelectItem>
                      <SelectItem value="nonaktif">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_name">Nama Stasiun *</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit_province">Provinsi *</Label>
                  <Input
                    id="edit_province"
                    value={formData.province}
                    onChange={(e) =>
                      setFormData({ ...formData, province: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit_city">Kabupaten / Kota *</Label>
                  <Input
                    id="edit_city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit_latitude">Latitude (Lintang) *</Label>
                  <Input
                    id="edit_latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit_longitude">Longitude (Bujur) *</Label>
                  <Input
                    id="edit_longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_description">Deskripsi / Catatan Lokasi</Label>
                <Input
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={formSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
