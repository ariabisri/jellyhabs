"use client"

import * as React from "react"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Plus,
  Search,
  Calendar,
  ChevronRight,
  Anchor,
  Download,
  Edit,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Users,
  Droplets,
  Bug,
  Clock,
  CloudSun,
  UserPlus,
  X,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

interface SamplingMember {
  id?: string
  user_id: string
  full_name?: string
  email?: string
  role_in_sampling: string
}

interface WaterQualitySummary {
  id: string
  record_code: string
  temperature_c: number | null
  salinity_psu: number | null
  dissolved_oxygen_mgl: number | null
  ph: number | null
  chlorophyll_a_ugl: number | null
}

interface PlanktonSummary {
  id: string
  record_code: string
  scientific_name: string
  common_name: string | null
  organism_category: string
  density_value: number
  density_unit: string
  toxicity_status: string
}

interface SamplingEventItem {
  id: string
  sampling_code: string
  sampling_date: string
  sampling_time: string | null
  weather_condition: string | null
  field_notes: string | null
  station_id: string
  station_code: string
  station_name: string
  city: string
  province: string
  latitude: number | null
  longitude: number | null
  recorded_by_id: string
  recorded_by_name: string
  recorded_by_email: string
  members: SamplingMember[]
  water_quality_count: number
  plankton_count: number
  water_quality_records?: WaterQualitySummary[]
  plankton_records?: PlanktonSummary[]
  created_at: string
}

interface StationOption {
  id: string
  station_code: string
  name: string
  city: string
  province: string
}

interface UserOption {
  id: string
  full_name: string
  email: string
  role_name?: string
}

function formatIndoDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-"
  try {
    const parts = dateStr.split("-")
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10)
      const day = parseInt(parts[2], 10)
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ]
      if (month >= 1 && month <= 12 && !isNaN(day) && !isNaN(year)) {
        return `${day} ${months[month - 1]} ${year}`
      }
    }
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

const initialForm = {
  sampling_code: "",
  station_id: "",
  sampling_date: new Date().toISOString().split("T")[0],
  sampling_time: "08:00",
  weather_condition: "Cerah",
  field_notes: "",
  members: [] as { user_id: string; role_in_sampling: string }[],
}

export default function SamplingPage() {
  const { authenticated, user } = useAuth()

  const [samplings, setSamplings] = React.useState<SamplingEventItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [stationFilter, setStationFilter] = React.useState("all")
  const [weatherFilter, setWeatherFilter] = React.useState("all")

  // Options
  const [stationOptions, setStationOptions] = React.useState<StationOption[]>([])
  const [userOptions, setUserOptions] = React.useState<UserOption[]>([])

  // Detail Modal
  const [selectedSampling, setSelectedSampling] = React.useState<SamplingEventItem | null>(null)
  const [detailLoading, setDetailLoading] = React.useState(false)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)

  // Form Modal (Add / Edit)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState(initialForm)
  const [formSubmitting, setFormSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  // Delete Modal
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [deletingItem, setDeletingItem] = React.useState<SamplingEventItem | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  // Toast Banner
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

  // Fetch Samplings
  const fetchSamplings = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search.trim()) params.append("q", search.trim())
      if (stationFilter !== "all") params.append("station_id", stationFilter)
      if (weatherFilter !== "all") params.append("weather_condition", weatherFilter)

      const res = await fetch(`/api/sampling?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setSamplings(data.data)
      } else {
        showBanner("error", data.error || "Gagal memuat daftar sampling event")
      }
    } catch (err) {
      console.error("Error fetching samplings:", err)
      showBanner("error", "Terjadi kesalahan jaringan saat memuat data")
    } finally {
      setLoading(false)
    }
  }, [search, stationFilter, weatherFilter])

  // Fetch Dropdown Options
  const fetchOptions = React.useCallback(async () => {
    try {
      const res = await fetch("/api/sampling/options")
      const data = await res.json()
      if (data.success && data.data) {
        setStationOptions(data.data.stations || [])
        setUserOptions(data.data.users || [])
      }
    } catch (err) {
      console.error("Error fetching options:", err)
    }
  }, [])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchSamplings()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchSamplings])

  React.useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  // Detail Handler
  const handleOpenDetail = async (item: SamplingEventItem) => {
    setSelectedSampling(item)
    setIsDetailOpen(true)
    setDetailLoading(true)

    try {
      const res = await fetch(`/api/sampling/${item.id}`)
      const data = await res.json()
      if (data.success) {
        setSelectedSampling(data.data)
      }
    } catch (err) {
      console.error("Error loading detail:", err)
    } finally {
      setDetailLoading(false)
    }
  }

  // Form Handlers
  const handleOpenAdd = () => {
    setIsEditing(false)
    setEditingId(null)
    setFormData({
      ...initialForm,
      sampling_code: `SMP-${Date.now().toString().slice(-4)}`,
      station_id: stationOptions[0]?.id || "",
      members: user?.id
        ? [{ user_id: user.id, role_in_sampling: "Ketua Tim Lapangan (Lead)" }]
        : [],
    })
    setFormError(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (item: SamplingEventItem) => {
    setIsEditing(true)
    setEditingId(item.id)
    setFormData({
      sampling_code: item.sampling_code,
      station_id: item.station_id,
      sampling_date: item.sampling_date,
      sampling_time: item.sampling_time || "08:00",
      weather_condition: item.weather_condition || "Cerah",
      field_notes: item.field_notes || "",
      members: item.members.map((m) => ({
        user_id: m.user_id,
        role_in_sampling: m.role_in_sampling,
      })),
    })
    setFormError(null)
    setIsFormOpen(true)
  }

  const handleAddMember = () => {
    if (userOptions.length === 0) return
    const existingIds = new Set(formData.members.map((m) => m.user_id))
    const availableUser = userOptions.find((u) => !existingIds.has(u.id)) || userOptions[0]
    setFormData({
      ...formData,
      members: [
        ...formData.members,
        {
          user_id: availableUser.id,
          role_in_sampling: "Pengambil Sampel Lapangan",
        },
      ],
    })
  }

  const handleRemoveMember = (index: number) => {
    setFormData({
      ...formData,
      members: formData.members.filter((_, idx) => idx !== index),
    })
  }

  const handleUpdateMember = (
    index: number,
    field: "user_id" | "role_in_sampling",
    val: string
  ) => {
    const updated = [...formData.members]
    updated[index] = { ...updated[index], [field]: val }
    setFormData({ ...formData, members: updated })
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSubmitting(true)

    try {
      const payload = {
        sampling_code: formData.sampling_code.trim(),
        station_id: formData.station_id,
        sampling_date: formData.sampling_date,
        sampling_time: formData.sampling_time ? `${formData.sampling_time}:00` : null,
        weather_condition: formData.weather_condition?.trim() || null,
        field_notes: formData.field_notes?.trim() || null,
        members: formData.members,
      }

      const url = isEditing ? `/api/sampling/${editingId}` : "/api/sampling"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setFormError(data.error || "Gagal menyimpan data sampling event")
        setFormSubmitting(false)
        return
      }

      setIsFormOpen(false)
      showBanner(
        "success",
        isEditing
          ? `Sampling event '${payload.sampling_code}' berhasil diperbarui`
          : `Sampling event '${payload.sampling_code}' berhasil ditambahkan`
      )
      fetchSamplings()
    } catch (err) {
      console.error("Error submitting sampling:", err)
      setFormError("Terjadi kesalahan jaringan saat menyimpan data")
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDeleteSubmit = async () => {
    if (!deletingItem) return
    setDeleteSubmitting(true)
    setDeleteError(null)

    try {
      const res = await fetch(`/api/sampling/${deletingItem.id}`, { method: "DELETE" })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setDeleteError(data.error || "Gagal menghapus sampling event")
        setDeleteSubmitting(false)
        return
      }

      setIsDeleteOpen(false)
      setDeletingItem(null)
      showBanner("success", data.message || "Sampling event berhasil dihapus")
      fetchSamplings()
    } catch (err) {
      console.error("Error deleting sampling:", err)
      setDeleteError("Terjadi kesalahan jaringan saat menghapus data")
    } finally {
      setDeleteSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toast Banner */}
      {banner && (
        <div
          className={cn(
            "p-3 text-sm rounded-lg flex items-center gap-2 border transition-all animate-in fade-in slide-in-from-top-2",
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

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Monitoring</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground">Sampling Event</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-7 w-7 text-primary" />
            Sampling Event
          </h1>
          <p className="text-muted-foreground">
            Catatan log jadwal pengambilan sampel lapangan, tim peneliti, dan pengaitan data parameter per stasiun.
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <a
            href="/api/sampling/export"
            className={cn(buttonVariants({ variant: "outline" }))}
            target="_blank"
            rel="noopener noreferrer"
            title="Unduh seluruh data sampling event sebagai CSV"
          >
            <Download className="mr-2 h-4 w-4" />
            Ekspor CSV
          </a>

          {authenticated && (
            <Button onClick={handleOpenAdd} className="shadow-xs">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Sampling
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari kode sampling, nama stasiun, cuaca, catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <Select value={stationFilter} onValueChange={(val) => setStationFilter(val || "all")}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Stasiun">
                {stationFilter === "all"
                  ? "Semua Stasiun"
                  : stationOptions.find((st) => st.id === stationFilter)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Stasiun</SelectItem>
              {stationOptions.map((st) => (
                <SelectItem key={st.id} value={st.id}>
                  {st.name} ({st.city})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={weatherFilter} onValueChange={(val) => setWeatherFilter(val || "all")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Kondisi Cuaca">
                {weatherFilter === "all" ? "Semua Cuaca" : weatherFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Cuaca</SelectItem>
              <SelectItem value="Cerah">Cerah</SelectItem>
              <SelectItem value="Berawan">Berawan</SelectItem>
              <SelectItem value="Hujan Ringan">Hujan Ringan</SelectItem>
              <SelectItem value="Hujan Lebat">Hujan Lebat</SelectItem>
              <SelectItem value="Berkabut">Berkabut</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Samplings */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[130px]">Kode Sampling</TableHead>
              <TableHead>Tanggal & Waktu</TableHead>
              <TableHead>Stasiun Monitoring</TableHead>
              <TableHead>Cuaca</TableHead>
              <TableHead>Tim Peneliti</TableHead>
              <TableHead className="text-center">Data Terkait</TableHead>
              <TableHead>Catatan Lapangan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Memuat data sampling events...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : samplings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="p-8">
                  <EmptyState
                    icon={Calendar}
                    title="Tidak ada data sampling"
                    description={
                      search || stationFilter !== "all" || weatherFilter !== "all"
                        ? "Tidak ditemukan data sampling event yang sesuai dengan filter pencarian."
                        : "Belum ada jadwal atau log sampling yang dicatat."
                    }
                    actionLabel={authenticated ? "Tambah Sampling Pertama" : undefined}
                    onAction={authenticated ? handleOpenAdd : undefined}
                  />
                </TableCell>
              </TableRow>
            ) : (
              samplings.map((s) => (
                <TableRow key={s.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono font-bold text-primary">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{s.sampling_code}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span className="font-semibold text-foreground">
                        {formatIndoDate(s.sampling_date)}
                      </span>
                      {s.sampling_time && (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {s.sampling_time} WIB
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/monitoring/stations/${s.station_code || s.station_id}`}
                      className="text-xs font-semibold text-foreground hover:text-primary hover:underline transition-colors block"
                    >
                      {s.station_name}
                    </Link>
                    <span className="text-[11px] text-muted-foreground">{s.city}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-medium bg-muted/50">
                      <CloudSun className="h-3 w-3 mr-1 text-primary" />
                      {s.weather_condition || "Cerah"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span className="font-medium text-foreground">
                        {s.recorded_by_name}
                      </span>
                      {s.members && s.members.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{s.members.length} peneliti lain
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-mono font-semibold flex items-center gap-1",
                          s.water_quality_count > 0
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                        title="Rekaman Kualitas Air"
                      >
                        <Droplets className="h-3 w-3" /> {s.water_quality_count}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-mono font-semibold flex items-center gap-1",
                          s.plankton_count > 0
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                            : "bg-muted text-muted-foreground"
                        )}
                        title="Rekaman Plankton / Ubur-ubur"
                      >
                        <Bug className="h-3 w-3" /> {s.plankton_count}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-muted-foreground max-w-[200px] truncate" title={s.field_notes || ""}>
                      {s.field_notes || "-"}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDetail(s)}
                        title="Lihat Detail"
                      >
                        <Eye className="h-4 w-4 text-primary" />
                        <span className="sr-only">Detail</span>
                      </Button>
                      {authenticated && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(s)}
                            title="Edit Sampling"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setDeletingItem(s)
                              setDeleteError(null)
                              setIsDeleteOpen(true)
                            }}
                            title="Hapus Sampling"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Hapus</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* MODAL DIALOG: DETAIL SAMPLING EVENT */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Detail Sampling Event &mdash; {selectedSampling?.sampling_code}
            </DialogTitle>
            <DialogDescription>
              Informasi lengkap kegiatan pengambilan sampel lapangan di stasiun monitoring.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Memuat detail sampling event...</span>
            </div>
          ) : selectedSampling ? (
            <div className="space-y-5 py-2">
              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-card border shadow-2xs">
                <div>
                  <span className="text-xs text-muted-foreground block">Stasiun Monitoring:</span>
                  <Link
                    href={`/monitoring/stations/${selectedSampling.station_code || selectedSampling.station_id}`}
                    className="font-semibold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1.5 mt-0.5"
                  >
                    <Anchor className="h-4 w-4 text-primary" />
                    {selectedSampling.station_name}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {selectedSampling.city}, {selectedSampling.province}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block">Waktu Pelaksanaan:</span>
                  <span className="font-semibold text-sm text-foreground block mt-0.5">
                    {formatIndoDate(selectedSampling.sampling_date)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Pukul: {selectedSampling.sampling_time ? `${selectedSampling.sampling_time} WIB` : "-"} &bull; Cuaca: {selectedSampling.weather_condition || "Cerah"}
                  </span>
                </div>
              </div>

              {/* Tim Peneliti Lapangan */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary" />
                  Tim Peneliti Lapangan
                </h4>
                <div className="p-3 rounded-lg border bg-muted/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b">
                    <div>
                      <span className="font-semibold text-foreground">{selectedSampling.recorded_by_name}</span>
                      <span className="text-muted-foreground text-[11px] block">{selectedSampling.recorded_by_email}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">Pencatat Utama (Logger)</Badge>
                  </div>
                  {selectedSampling.members && selectedSampling.members.length > 0 ? (
                    selectedSampling.members.map((m, idx) => (
                      <div key={m.id || idx} className="flex items-center justify-between py-1 border-b last:border-b-0">
                        <div>
                          <span className="font-medium text-foreground">{m.full_name}</span>
                          <span className="text-muted-foreground text-[11px] block">{m.email}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{m.role_in_sampling}</Badge>
                      </div>
                    ))
                  ) : (
                    <span className="text-muted-foreground italic text-xs">Tidak ada anggota tim tambahan yang didaftarkan.</span>
                  )}
                </div>
              </div>

              {/* Catatan Lapangan */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" />
                  Catatan & Kondisi Lapangan
                </h4>
                <p className="text-xs text-muted-foreground p-3 rounded-lg bg-card border shadow-2xs leading-relaxed whitespace-pre-wrap">
                  {selectedSampling.field_notes || "Tidak ada catatan lapangan khusus."}
                </p>
              </div>

              {/* Data Kualitas Air Terhubung */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Droplets className="h-4 w-4 text-primary" />
                    Data Kualitas Air Terkait
                  </h4>
                  <span className="text-xs text-muted-foreground font-mono">
                    {selectedSampling.water_quality_records?.length || selectedSampling.water_quality_count || 0} rekaman
                  </span>
                </div>
                {selectedSampling.water_quality_records && selectedSampling.water_quality_records.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedSampling.water_quality_records.map((wq) => (
                      <div key={wq.id} className="p-2.5 rounded-lg border bg-card shadow-2xs text-xs space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-primary font-mono">{wq.record_code}</span>
                          <span className="text-foreground">Suhu: {wq.temperature_c ?? "-"} °C</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-[11px] text-muted-foreground pt-1 border-t">
                          <span>Sal: {wq.salinity_psu ?? "-"} psu</span>
                          <span>DO: {wq.dissolved_oxygen_mgl ?? "-"} mg/L</span>
                          <span>Klor-a: {wq.chlorophyll_a_ugl ?? "-"} µg/L</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-md bg-muted/30 border text-xs text-muted-foreground italic">
                    Belum ada parameter kualitas air yang dihubungkan dengan sampling ini.
                  </div>
                )}
              </div>

              {/* Data Plankton Terhubung */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Bug className="h-4 w-4 text-primary" />
                    Temuan Spesies Plankton & Ubur-ubur Terkait
                  </h4>
                  <span className="text-xs text-muted-foreground font-mono">
                    {selectedSampling.plankton_records?.length || selectedSampling.plankton_count || 0} rekaman
                  </span>
                </div>
                {selectedSampling.plankton_records && selectedSampling.plankton_records.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedSampling.plankton_records.map((plk) => (
                      <div key={plk.id} className="p-2.5 rounded-lg border bg-card shadow-2xs text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold italic text-foreground">{plk.scientific_name}</span>
                          <Badge variant={plk.toxicity_status.toLowerCase().includes("beracun") ? "destructive" : "secondary"} className="text-[9px]">
                            {plk.toxicity_status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                          <span>{plk.organism_category}</span>
                          <span className="font-mono font-medium text-foreground">
                            {Number(plk.density_value).toLocaleString("id-ID")} {plk.density_unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-md bg-muted/30 border text-xs text-muted-foreground italic">
                    Belum ada rekaman spesies yang dihubungkan dengan sampling ini.
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <DialogFooter className="border-t pt-3">
            <Button type="button" onClick={() => setIsDetailOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DIALOG: ADD / EDIT SAMPLING EVENT */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Sampling Event" : "Tambah Sampling Event Baru"}
              </DialogTitle>
              <DialogDescription>
                Catat jadwal pengambilan sampel lapangan dan tentukan tim peneliti yang bertugas.
              </DialogDescription>
            </DialogHeader>

            {formError && (
              <div className="p-3 my-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4 py-3">
              {/* Bagian 1: Informasi Dasar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sampling_code">Kode Sampling *</Label>
                  <Input
                    id="sampling_code"
                    placeholder="misal: SMP-001"
                    value={formData.sampling_code}
                    onChange={(e) =>
                      setFormData({ ...formData, sampling_code: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="station_id">Stasiun Monitoring *</Label>
                  <Select
                    value={formData.station_id}
                    onValueChange={(val) =>
                      setFormData({ ...formData, station_id: val || "" })
                    }
                  >
                    <SelectTrigger id="station_id" className="w-full">
                      <SelectValue placeholder="Pilih Stasiun">
                        {stationOptions.find((st) => st.id === formData.station_id)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {stationOptions.map((st) => (
                        <SelectItem key={st.id} value={st.id}>
                          {st.name} ({st.city})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bagian 2: Waktu & Cuaca */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sampling_date">Tanggal Sampling *</Label>
                  <Input
                    id="sampling_date"
                    type="date"
                    value={formData.sampling_date}
                    onChange={(e) =>
                      setFormData({ ...formData, sampling_date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sampling_time">Waktu Pengambilan</Label>
                  <Input
                    id="sampling_time"
                    type="time"
                    value={formData.sampling_time}
                    onChange={(e) =>
                      setFormData({ ...formData, sampling_time: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="weather_condition">Kondisi Cuaca</Label>
                  <Select
                    value={formData.weather_condition}
                    onValueChange={(val) =>
                      setFormData({ ...formData, weather_condition: val || "Cerah" })
                    }
                  >
                    <SelectTrigger id="weather_condition" className="w-full">
                      <SelectValue placeholder="Pilih Cuaca">
                        {formData.weather_condition}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cerah">Cerah</SelectItem>
                      <SelectItem value="Berawan">Berawan</SelectItem>
                      <SelectItem value="Hujan Ringan">Hujan Ringan</SelectItem>
                      <SelectItem value="Hujan Lebat">Hujan Lebat</SelectItem>
                      <SelectItem value="Berkabut">Berkabut</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bagian 3: Tim Peneliti Lapangan (Multi-Peneliti) */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary" />
                    Anggota Tim Peneliti Lapangan
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddMember}
                    className="h-7 text-xs"
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    Tambah Anggota
                  </Button>
                </div>

                {formData.members.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic p-2 rounded bg-muted/30">
                    Belum ada anggota tim tambahan. Anda dapat menambahkan peneliti lain yang terlibat dalam sampling ini.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {formData.members.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20"
                      >
                        <div className="flex-1">
                          <Select
                            value={m.user_id}
                            onValueChange={(val) =>
                              handleUpdateMember(idx, "user_id", val || "")
                            }
                          >
                            <SelectTrigger className="w-full text-xs">
                              <SelectValue placeholder="Pilih Peneliti">
                                {userOptions.find((u) => u.id === m.user_id)?.full_name}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {userOptions.map((u) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.full_name} ({u.role_name || "Peneliti"})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="w-[180px]">
                          <Input
                            placeholder="Peran (misal: Field Sampler)"
                            value={m.role_in_sampling}
                            onChange={(e) =>
                              handleUpdateMember(idx, "role_in_sampling", e.target.value)
                            }
                            className="text-xs h-9"
                          />
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(idx)}
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Hapus Anggota</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bagian 4: Catatan Lapangan */}
              <div className="space-y-1.5 pt-2 border-t">
                <Label htmlFor="field_notes">Catatan Kondisi Lapangan & Log</Label>
                <textarea
                  id="field_notes"
                  rows={3}
                  value={formData.field_notes}
                  onChange={(e) =>
                    setFormData({ ...formData, field_notes: e.target.value })
                  }
                  placeholder="Kondisi pasang surut, arus, visibilitas air, kendala peralatan lapangan..."
                  className="w-full text-xs p-2.5 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={formSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Simpan Perubahan" : "Tambah Sampling"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION DIALOG: DELETE SAMPLING EVENT */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Konfirmasi Hapus Sampling Event
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data sampling{" "}
              <strong className="text-foreground">{deletingItem?.sampling_code}</strong> (Stasiun: {deletingItem?.station_name})?
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="p-3 my-2 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{deleteError}</span>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={deleteSubmitting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSubmit}
              disabled={deleteSubmitting}
            >
              {deleteSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus Sampling
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
