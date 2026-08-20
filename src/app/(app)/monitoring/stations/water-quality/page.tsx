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
  Droplets,
  ChevronRight,
  Anchor,
  Download,
  Upload,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

interface WaterQualityRecord {
  id: string
  record_code: string
  sampling_event_id: string
  sampling_code: string
  sampling_date: string
  sampling_time: string | null
  weather_condition: string | null
  station_id: string
  station_code: string
  station_name: string
  city: string
  province: string
  temperature_c: number | string | null
  salinity_psu: number | string | null
  dissolved_oxygen_mgl: number | string | null
  ph: number | string | null
  chlorophyll_a_ugl: number | string | null
  turbidity_ntu: number | string | null
  current_speed_ms: number | string | null
  depth_m: number | string | null
  notes: string | null
  created_at: string
  linked_bloom_events_count: number
}

interface SamplingOption {
  id: string
  sampling_code: string
  sampling_date: string
  station_name: string
  station_code: string
}

interface StationOption {
  id: string
  station_code: string
  name: string
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

const initialFormData = {
  record_code: "",
  sampling_event_id: "",
  temperature_c: "",
  salinity_psu: "",
  dissolved_oxygen_mgl: "",
  ph: "",
  chlorophyll_a_ugl: "",
  turbidity_ntu: "",
  current_speed_ms: "",
  depth_m: "",
  notes: "",
}

export default function WaterQualityPage() {
  const { authenticated } = useAuth()

  const [records, setRecords] = React.useState<WaterQualityRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [stationFilter, setStationFilter] = React.useState("all")
  const [chlFilter, setChlFilter] = React.useState("all")

  // Options
  const [samplingOptions, setSamplingOptions] = React.useState<SamplingOption[]>([])
  const [stationOptions, setStationOptions] = React.useState<StationOption[]>([])

  // Form Dialog state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState(initialFormData)
  const [formSubmitting, setFormSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  // Upload Dialog state
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)
  const [uploadFile, setUploadFile] = React.useState<File | null>(null)
  const [uploadSubmitting, setUploadSubmitting] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const [uploadResult, setUploadResult] = React.useState<{
    message: string
    total: number
    inserted: number
    updated: number
    errors: number
    failed: { row: number; reason: string }[]
  } | null>(null)

  // Delete Confirmation Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [deletingRecord, setDeletingRecord] = React.useState<WaterQualityRecord | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  // Toast Notification
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

  const fetchRecords = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.append("q", searchQuery.trim())
      if (stationFilter !== "all") params.append("station_id", stationFilter)
      if (chlFilter === "warning") params.append("min_chlorophyll", "20")
      if (chlFilter === "bloom") params.append("min_chlorophyll", "40")

      const res = await fetch(`/api/water-quality?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setRecords(data.data)
      } else {
        showBanner("error", data.error || "Gagal memuat data kualitas air")
      }
    } catch (err) {
      console.error("Error fetching water quality:", err)
      showBanner("error", "Terjadi kesalahan jaringan saat memuat data kualitas air")
    } finally {
      setLoading(false)
    }
  }, [searchQuery, stationFilter, chlFilter])

  const fetchOptions = React.useCallback(async () => {
    try {
      const res = await fetch("/api/water-quality/options")
      const data = await res.json()
      if (data.success && data.data) {
        setSamplingOptions(data.data.sampling_events || [])
        setStationOptions(data.data.stations || [])
      }
    } catch (err) {
      console.error("Error fetching options:", err)
    }
  }, [])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecords()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchRecords])

  React.useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  const handleOpenAdd = () => {
    setIsEditing(false)
    setEditingId(null)
    setFormData({
      ...initialFormData,
      record_code: `WQ-${Date.now().toString().slice(-4)}`,
      sampling_event_id: samplingOptions[0]?.id || "",
    })
    setFormError(null)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (rec: WaterQualityRecord) => {
    setIsEditing(true)
    setEditingId(rec.id)
    setFormData({
      record_code: rec.record_code,
      sampling_event_id: rec.sampling_event_id,
      temperature_c: rec.temperature_c !== null ? String(rec.temperature_c) : "",
      salinity_psu: rec.salinity_psu !== null ? String(rec.salinity_psu) : "",
      dissolved_oxygen_mgl: rec.dissolved_oxygen_mgl !== null ? String(rec.dissolved_oxygen_mgl) : "",
      ph: rec.ph !== null ? String(rec.ph) : "",
      chlorophyll_a_ugl: rec.chlorophyll_a_ugl !== null ? String(rec.chlorophyll_a_ugl) : "",
      turbidity_ntu: rec.turbidity_ntu !== null ? String(rec.turbidity_ntu) : "",
      current_speed_ms: rec.current_speed_ms !== null ? String(rec.current_speed_ms) : "",
      depth_m: rec.depth_m !== null ? String(rec.depth_m) : "",
      notes: rec.notes || "",
    })
    setFormError(null)
    setIsDialogOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSubmitting(true)

    try {
      const payload = {
        record_code: formData.record_code.trim(),
        sampling_event_id: formData.sampling_event_id,
        temperature_c: formData.temperature_c ? parseFloat(formData.temperature_c) : null,
        salinity_psu: formData.salinity_psu ? parseFloat(formData.salinity_psu) : null,
        dissolved_oxygen_mgl: formData.dissolved_oxygen_mgl ? parseFloat(formData.dissolved_oxygen_mgl) : null,
        ph: formData.ph ? parseFloat(formData.ph) : null,
        chlorophyll_a_ugl: formData.chlorophyll_a_ugl ? parseFloat(formData.chlorophyll_a_ugl) : null,
        turbidity_ntu: formData.turbidity_ntu ? parseFloat(formData.turbidity_ntu) : null,
        current_speed_ms: formData.current_speed_ms ? parseFloat(formData.current_speed_ms) : null,
        depth_m: formData.depth_m ? parseFloat(formData.depth_m) : null,
        notes: formData.notes.trim(),
      }

      const url = isEditing ? `/api/water-quality/${editingId}` : "/api/water-quality"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setFormError(data.error || "Gagal menyimpan data kualitas air")
        setFormSubmitting(false)
        return
      }

      setIsDialogOpen(false)
      showBanner(
        "success",
        isEditing
          ? "Data kualitas air berhasil diperbarui"
          : "Data kualitas air baru berhasil ditambahkan"
      )
      fetchRecords()
    } catch (err) {
      console.error("Error submitting water quality:", err)
      setFormError("Terjadi kesalahan jaringan saat menyimpan data kualitas air")
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleOpenDelete = (rec: WaterQualityRecord) => {
    setDeletingRecord(rec)
    setDeleteError(null)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteSubmit = async () => {
    if (!deletingRecord) return
    setDeleteSubmitting(true)
    setDeleteError(null)

    try {
      const res = await fetch(`/api/water-quality/${deletingRecord.id}`, {
        method: "DELETE",
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setDeleteError(data.error || "Gagal menghapus data kualitas air")
        setDeleteSubmitting(false)
        return
      }

      setIsDeleteDialogOpen(false)
      setDeletingRecord(null)
      showBanner("success", data.message || "Data berhasil dihapus")
      fetchRecords()
    } catch (err) {
      console.error("Error deleting water quality record:", err)
      setDeleteError("Terjadi kesalahan jaringan saat menghapus data")
    } finally {
      setDeleteSubmitting(false)
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile) {
      setUploadError("Silakan pilih berkas CSV terlebih dahulu")
      return
    }

    setUploadSubmitting(true)
    setUploadError(null)
    setUploadResult(null)

    try {
      const uploadData = new FormData()
      uploadData.append("file", uploadFile)

      const res = await fetch("/api/water-quality/upload", {
        method: "POST",
        body: uploadData,
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setUploadError(data.error || "Gagal memproses berkas CSV")
        if (data.failed_rows) {
          setUploadResult({
            message: data.error,
            total: 0,
            inserted: 0,
            updated: 0,
            errors: data.failed_rows.length,
            failed: data.failed_rows,
          })
        }
        setUploadSubmitting(false)
        return
      }

      setUploadResult({
        message: data.message,
        total: data.data.total_rows_processed,
        inserted: data.data.inserted_count,
        updated: data.data.updated_count,
        errors: data.data.error_count,
        failed: data.data.failed_rows || [],
      })

      showBanner("success", data.message)
      fetchRecords()
    } catch (err) {
      console.error("Error uploading CSV:", err)
      setUploadError("Terjadi kesalahan jaringan saat mengunggah berkas CSV")
    } finally {
      setUploadSubmitting(false)
    }
  }

  const handleDownloadTemplate = () => {
    const templateContent =
      "record_code,sampling_code,temperature_c,salinity_psu,dissolved_oxygen_mgl,ph,chlorophyll_a_ugl,turbidity_ntu,current_speed_ms,depth_m,notes\r\n" +
      "WQ-TEMPLATE-01,SMP-001,29.5,32.0,5.4,8.1,12.5,2.1,0.25,1.0,Kondisi perairan normal\r\n" +
      "WQ-TEMPLATE-02,SMP-002,30.2,33.0,4.8,7.9,45.0,8.5,0.15,2.5,Klorofil-a tinggi pemicu blooming"

    const blob = new Blob(["\uFEFF" + templateContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "template_water_quality.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
        <Link
          href="/monitoring/stations"
          className="hover:text-primary transition-colors flex items-center gap-1"
        >
          <Anchor className="h-3.5 w-3.5" />
          Stasiun Monitoring
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground">Kualitas Air</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Droplets className="h-7 w-7 text-primary" />
            Data Kualitas Air
          </h1>
          <p className="text-muted-foreground">
            Parameter fisik-kimia lingkungan laut (Suhu, Salinitas, DO, pH, Klorofil-a) per stasiun monitoring.
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <a
            href="/api/water-quality/export"
            className={cn(buttonVariants({ variant: "outline" }))}
            target="_blank"
            rel="noopener noreferrer"
            title="Unduh seluruh data sebagai CSV"
          >
            <Download className="mr-2 h-4 w-4" />
            Ekspor CSV
          </a>

          {authenticated && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setUploadFile(null)
                  setUploadError(null)
                  setUploadResult(null)
                  setIsUploadOpen(true)
                }}
              >
                <Upload className="mr-2 h-4 w-4 text-primary" />
                Unggah CSV
              </Button>
              <Button onClick={handleOpenAdd} className="shadow-xs">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Data
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari kode WQ, kode sampling, nama stasiun, catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <Select value={stationFilter} onValueChange={(val) => setStationFilter(val || "all")}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Pilih Stasiun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Stasiun</SelectItem>
              {stationOptions.map((st) => (
                <SelectItem key={st.id} value={st.id}>
                  {st.station_code} - {st.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={chlFilter} onValueChange={(val) => setChlFilter(val || "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Klorofil-a" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Klorofil-a</SelectItem>
              <SelectItem value="warning">Waspada (&ge; 20 µg/L)</SelectItem>
              <SelectItem value="bloom">Blooming (&ge; 40 µg/L)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Kode WQ</TableHead>
              <TableHead>Sampling Event & Waktu</TableHead>
              <TableHead>Stasiun</TableHead>
              <TableHead className="text-right">Suhu (°C)</TableHead>
              <TableHead className="text-right">Salinitas (PSU)</TableHead>
              <TableHead className="text-right">DO (mg/L)</TableHead>
              <TableHead className="text-right">pH</TableHead>
              <TableHead className="text-right">Klorofil-a (µg/L)</TableHead>
              {authenticated && <TableHead className="text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={authenticated ? 9 : 8} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Memuat data parameter kualitas air...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={authenticated ? 9 : 8} className="p-8">
                  <EmptyState
                    icon={Droplets}
                    title="Tidak ada data kualitas air"
                    description={
                      searchQuery || stationFilter !== "all" || chlFilter !== "all"
                        ? "Tidak ditemukan data yang sesuai dengan kriteria pencarian / filter."
                        : "Belum ada rekaman parameter kualitas air dalam sistem."
                    }
                    actionLabel={authenticated ? "Tambah Data Pertama" : undefined}
                    onAction={authenticated ? handleOpenAdd : undefined}
                  />
                </TableCell>
              </TableRow>
            ) : (
              records.map((r) => {
                const chlVal = Number(r.chlorophyll_a_ugl) || 0
                return (
                  <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono font-bold text-primary">
                      <div className="flex items-center gap-1.5">
                        <Droplets className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{r.record_code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-mono font-semibold text-foreground">
                          {r.sampling_code}
                        </span>
                        <span className="text-muted-foreground">{formatIndoDate(r.sampling_date)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/monitoring/stations/${r.station_code || r.station_id}`}
                        className="text-xs font-semibold text-foreground hover:text-primary hover:underline transition-colors block"
                      >
                        {r.station_name}
                      </Link>
                      <span className="text-[11px] text-muted-foreground">{r.city}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {r.temperature_c !== null ? `${Number(r.temperature_c).toFixed(1)}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {r.salinity_psu !== null ? `${Number(r.salinity_psu).toFixed(1)}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {r.dissolved_oxygen_mgl !== null ? `${Number(r.dissolved_oxygen_mgl).toFixed(1)}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {r.ph !== null ? `${Number(r.ph).toFixed(1)}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold">
                      {r.chlorophyll_a_ugl !== null ? (
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded",
                            chlVal >= 40
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold"
                              : chlVal >= 20
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold"
                              : "text-foreground"
                          )}
                        >
                          {Number(r.chlorophyll_a_ugl).toFixed(1)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    {authenticated && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(r)}
                            title="Edit Data"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleOpenDelete(r)}
                            title="Hapus Data"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Hapus</span>
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

      {/* Modal Dialog Add / Edit Single Record */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Data Kualitas Air" : "Tambah Data Kualitas Air"}
              </DialogTitle>
              <DialogDescription>
                Masukkan parameter fisik-kimia perairan untuk sampling yang dipilih.
              </DialogDescription>
            </DialogHeader>

            {formError && (
              <div className="p-3 my-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid gap-3.5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="record_code">Kode Rekord *</Label>
                  <Input
                    id="record_code"
                    placeholder="misal: WQ-101"
                    value={formData.record_code}
                    onChange={(e) =>
                      setFormData({ ...formData, record_code: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sampling_event_id">Sampling Event *</Label>
                  <Select
                    value={formData.sampling_event_id}
                    onValueChange={(val) =>
                      setFormData({ ...formData, sampling_event_id: val || "" })
                    }
                  >
                    <SelectTrigger id="sampling_event_id" className="w-full">
                      <SelectValue placeholder="Pilih Sampling Event" />
                    </SelectTrigger>
                    <SelectContent>
                      {samplingOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.sampling_code} &mdash; {opt.station_name} ({formatIndoDate(opt.sampling_date)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="temperature_c">Suhu (°C)</Label>
                  <Input
                    id="temperature_c"
                    type="number"
                    step="0.01"
                    placeholder="misal: 29.5"
                    value={formData.temperature_c}
                    onChange={(e) =>
                      setFormData({ ...formData, temperature_c: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="salinity_psu">Salinitas (PSU)</Label>
                  <Input
                    id="salinity_psu"
                    type="number"
                    step="0.01"
                    placeholder="misal: 32.0"
                    value={formData.salinity_psu}
                    onChange={(e) =>
                      setFormData({ ...formData, salinity_psu: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ph">pH</Label>
                  <Input
                    id="ph"
                    type="number"
                    step="0.01"
                    placeholder="misal: 8.1"
                    value={formData.ph}
                    onChange={(e) =>
                      setFormData({ ...formData, ph: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dissolved_oxygen_mgl">DO (mg/L)</Label>
                  <Input
                    id="dissolved_oxygen_mgl"
                    type="number"
                    step="0.01"
                    placeholder="misal: 5.4"
                    value={formData.dissolved_oxygen_mgl}
                    onChange={(e) =>
                      setFormData({ ...formData, dissolved_oxygen_mgl: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="chlorophyll_a_ugl">Klorofil-a (µg/L)</Label>
                  <Input
                    id="chlorophyll_a_ugl"
                    type="number"
                    step="0.01"
                    placeholder="misal: 12.5"
                    value={formData.chlorophyll_a_ugl}
                    onChange={(e) =>
                      setFormData({ ...formData, chlorophyll_a_ugl: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="turbidity_ntu">Kekeruhan (NTU)</Label>
                  <Input
                    id="turbidity_ntu"
                    type="number"
                    step="0.01"
                    placeholder="misal: 2.1"
                    value={formData.turbidity_ntu}
                    onChange={(e) =>
                      setFormData({ ...formData, turbidity_ntu: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="current_speed_ms">Kecepatan Arus (m/s)</Label>
                  <Input
                    id="current_speed_ms"
                    type="number"
                    step="0.01"
                    placeholder="misal: 0.25"
                    value={formData.current_speed_ms}
                    onChange={(e) =>
                      setFormData({ ...formData, current_speed_ms: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="depth_m">Kedalaman Ukur (m)</Label>
                  <Input
                    id="depth_m"
                    type="number"
                    step="0.01"
                    placeholder="misal: 1.0"
                    value={formData.depth_m}
                    onChange={(e) =>
                      setFormData({ ...formData, depth_m: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Catatan Tambahan</Label>
                <Input
                  id="notes"
                  placeholder="Kondisi lapangan, pengamatan visual, atau catatan sensor..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={formSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Simpan Perubahan" : "Tambah Data"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog Bulk CSV Upload */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleUploadSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Unggah Dataset CSV Kualitas Air
              </DialogTitle>
              <DialogDescription>
                Unggah berkas CSV untuk mengimpor atau memperbarui data kualitas air secara massal.
              </DialogDescription>
            </DialogHeader>

            <div className="p-3 my-2 text-xs rounded-lg bg-primary/10 border border-primary/20 text-foreground flex items-start gap-2">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-primary">Format Kolom CSV yang Didukung:</p>
                <p className="mt-0.5 text-muted-foreground">
                  <code className="text-[11px] font-mono font-bold">record_code, sampling_code, temperature_c, salinity_psu, dissolved_oxygen_mgl, ph, chlorophyll_a_ugl, turbidity_ntu, current_speed_ms, depth_m, notes</code>
                </p>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="mt-2 text-primary underline font-medium hover:text-primary/80 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Download className="h-3 w-3" /> Unduh Contoh Template CSV
                </button>
              </div>
            </div>

            {uploadError && (
              <div className="p-3 my-2 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadResult && (
              <div className="p-3 my-2 text-sm rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{uploadResult.message}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                  <p>Total data diproses: {uploadResult.total}</p>
                  <p>Data baru: {uploadResult.inserted} | Data diperbarui: {uploadResult.updated}</p>
                  {uploadResult.errors > 0 && (
                    <p className="text-destructive font-medium">Gagal diimpor: {uploadResult.errors} baris</p>
                  )}
                </div>
              </div>
            )}

            <div className="py-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 transition-colors bg-muted/20 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">
                  {uploadFile ? uploadFile.name : "Pilih atau Seret Berkas CSV ke Sini"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {uploadFile
                    ? `${(uploadFile.size / 1024).toFixed(1)} KB`
                    : "Maksimal ukuran berkas 10 MB (.csv)"}
                </p>
                <label className="mt-3 inline-flex items-center justify-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs">
                  Pilih Berkas
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0])
                        setUploadError(null)
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUploadOpen(false)}
                disabled={uploadSubmitting}
              >
                Tutup
              </Button>
              <Button type="submit" disabled={uploadSubmitting || !uploadFile}>
                {uploadSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Mulai Unggah & Proses
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog Delete */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Konfirmasi Hapus Data Kualitas Air
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data kualitas air{" "}
              <strong className="text-foreground">{deletingRecord?.record_code}</strong> (Sampling: {deletingRecord?.sampling_code} &mdash; {deletingRecord?.station_name}, {formatIndoDate(deletingRecord?.sampling_date)})?
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
              onClick={() => setIsDeleteDialogOpen(false)}
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
              Hapus Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
