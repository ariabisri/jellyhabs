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
  Eye,
  Layers,
  FlaskConical,
  Compass,
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
  tds_gl?: number | string | null
  ph_mv?: number | string | null
  orp_mv?: number | string | null
  conductivity_ms_cm?: number | string | null
  sigma_t?: number | string | null
  nitrate_no3_mgl?: number | string | null
  nitrite_no2_mgl?: number | string | null
  phosphorus_p_mgl?: number | string | null
  phosphate_po4_mgl?: number | string | null
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
  tds_gl: "",
  ph_mv: "",
  orp_mv: "",
  conductivity_ms_cm: "",
  sigma_t: "",
  nitrate_no3_mgl: "",
  nitrite_no2_mgl: "",
  phosphorus_p_mgl: "",
  phosphate_po4_mgl: "",
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
  const [showExtendedParams, setShowExtendedParams] = React.useState(false)

  // Upload Dialog state
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)
  const [uploadFile, setUploadFile] = React.useState<File | null>(null)
  const [uploadTargetStation, setUploadTargetStation] = React.useState<string>("all")
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

  // Detail View Dialog
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [detailRecord, setDetailRecord] = React.useState<WaterQualityRecord | null>(null)

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
      setBanner(null)
    }, 4000)
  }

  const fetchRecords = React.useCallback(async () => {
    setLoading(true)
    try {
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
    setShowExtendedParams(false)
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
      tds_gl: rec.tds_gl !== null && rec.tds_gl !== undefined ? String(rec.tds_gl) : "",
      ph_mv: rec.ph_mv !== null && rec.ph_mv !== undefined ? String(rec.ph_mv) : "",
      orp_mv: rec.orp_mv !== null && rec.orp_mv !== undefined ? String(rec.orp_mv) : "",
      conductivity_ms_cm: rec.conductivity_ms_cm !== null && rec.conductivity_ms_cm !== undefined ? String(rec.conductivity_ms_cm) : "",
      sigma_t: rec.sigma_t !== null && rec.sigma_t !== undefined ? String(rec.sigma_t) : "",
      nitrate_no3_mgl: rec.nitrate_no3_mgl !== null && rec.nitrate_no3_mgl !== undefined ? String(rec.nitrate_no3_mgl) : "",
      nitrite_no2_mgl: rec.nitrite_no2_mgl !== null && rec.nitrite_no2_mgl !== undefined ? String(rec.nitrite_no2_mgl) : "",
      phosphorus_p_mgl: rec.phosphorus_p_mgl !== null && rec.phosphorus_p_mgl !== undefined ? String(rec.phosphorus_p_mgl) : "",
      phosphate_po4_mgl: rec.phosphate_po4_mgl !== null && rec.phosphate_po4_mgl !== undefined ? String(rec.phosphate_po4_mgl) : "",
      notes: rec.notes || "",
    })
    setShowExtendedParams(Boolean(rec.tds_gl || rec.orp_mv || rec.nitrate_no3_mgl || rec.conductivity_ms_cm))
    setFormError(null)
    setIsDialogOpen(true)
  }

  const handleOpenDetail = (rec: WaterQualityRecord) => {
    setDetailRecord(rec)
    setIsDetailOpen(true)
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
        tds_gl: formData.tds_gl ? parseFloat(formData.tds_gl) : null,
        ph_mv: formData.ph_mv ? parseFloat(formData.ph_mv) : null,
        orp_mv: formData.orp_mv ? parseFloat(formData.orp_mv) : null,
        conductivity_ms_cm: formData.conductivity_ms_cm ? parseFloat(formData.conductivity_ms_cm) : null,
        sigma_t: formData.sigma_t ? parseFloat(formData.sigma_t) : null,
        nitrate_no3_mgl: formData.nitrate_no3_mgl ? parseFloat(formData.nitrate_no3_mgl) : null,
        nitrite_no2_mgl: formData.nitrite_no2_mgl ? parseFloat(formData.nitrite_no2_mgl) : null,
        phosphorus_p_mgl: formData.phosphorus_p_mgl ? parseFloat(formData.phosphorus_p_mgl) : null,
        phosphate_po4_mgl: formData.phosphate_po4_mgl ? parseFloat(formData.phosphate_po4_mgl) : null,
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
      setUploadError("Silakan pilih berkas spreadsheet (.xlsx, .xls, .csv) terlebih dahulu")
      return
    }

    setUploadSubmitting(true)
    setUploadError(null)
    setUploadResult(null)

    try {
      const uploadData = new FormData()
      uploadData.append("file", uploadFile)
      if (uploadTargetStation && uploadTargetStation !== "all") {
        uploadData.append("station_id", uploadTargetStation)
      }

      const res = await fetch("/api/water-quality/upload", {
        method: "POST",
        body: uploadData,
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setUploadError(data.error || "Gagal memproses berkas spreadsheet")
        if (data.failed_rows && data.failed_rows.length > 0) {
          setUploadResult({
            message: "Terdapat baris data yang gagal diproses",
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
        message: data.message || "Data berhasil diimpor",
        total: data.data?.total_rows_processed || 0,
        inserted: data.data?.inserted_count || 0,
        updated: data.data?.updated_count || 0,
        errors: data.data?.error_count || 0,
        failed: data.data?.failed_rows || [],
      })
      showBanner("success", data.message || "Unggahan berkas berhasil diproses")
      fetchRecords()
    } catch (err) {
      console.error("Error uploading file:", err)
      setUploadError("Terjadi kesalahan jaringan saat mengunggah berkas")
    } finally {
      setUploadSubmitting(false)
    }
  }

  const handleDownloadTemplate = () => {
    window.location.href = "/api/water-quality/template"
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
          <span>{banner.message}</span>
        </div>
      )}

      {/* Header & Breadcrumb */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/monitoring/stations" className="hover:text-foreground transition-colors">
            Stasiun Monitoring
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-semibold">Kualitas Air</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Droplets className="h-7 w-7 text-primary" />
              Monitoring Parameter Kualitas Air
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Data parameter oseanografi fisika, kimia, dan nutrien pesisir laut & stasiun pemantauan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Tombol Unduh Template Resmi */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="text-xs font-semibold shadow-xs"
              title="Unduh Template Excel Format Resmi Kualitas Air"
            >
              <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Template Excel
            </Button>

            {authenticated && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUploadFile(null)
                    setUploadError(null)
                    setUploadResult(null)
                    setIsUploadOpen(true)
                  }}
                  className="text-xs font-semibold shadow-xs"
                >
                  <Upload className="mr-1.5 h-4 w-4 text-primary" />
                  Upload Excel / CSV
                </Button>

                <Button size="sm" onClick={handleOpenAdd} className="text-xs font-semibold shadow-xs">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Tambah Data
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari kode WQ, kode sampling, stasiun, kota, atau catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select value={stationFilter} onValueChange={(val) => setStationFilter(val || "all")}>
            <SelectTrigger className="w-full md:w-[200px] h-9 text-xs font-semibold">
              <SelectValue placeholder="Semua Stasiun" />
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
            <SelectTrigger className="w-full md:w-[170px] h-9 text-xs font-semibold">
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
              <TableHead>Stasiun / Lokasi</TableHead>
              <TableHead className="text-right">Suhu (°C)</TableHead>
              <TableHead className="text-right">Sal (PSU)</TableHead>
              <TableHead className="text-right">DO (mg/L)</TableHead>
              <TableHead className="text-right">pH</TableHead>
              <TableHead className="text-right">TDS (g/L)</TableHead>
              <TableHead className="text-right">Klorofil-a</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Memuat data parameter kualitas air...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="p-8">
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
                const hasExtended = Boolean(
                  r.tds_gl || r.orp_mv || r.conductivity_ms_cm || r.nitrate_no3_mgl || r.phosphate_po4_mgl
                )
                return (
                  <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono font-bold text-primary">
                      <div className="flex items-center gap-1.5">
                        <Droplets className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{r.record_code}</span>
                      </div>
                      {hasExtended && (
                        <Badge variant="outline" className="mt-1 text-[9px] py-0 px-1 font-mono text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                          Logbook+
                        </Badge>
                      )}
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
                      {r.ph !== null ? `${Number(r.ph).toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {r.tds_gl !== null && r.tds_gl !== undefined ? `${Number(r.tds_gl).toFixed(1)}` : "-"}
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
                          {Number(r.chlorophyll_a_ugl).toFixed(1)} µg/L
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetail(r)}
                          title="Lihat Detail Lengkap Parameter"
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4 text-primary" />
                          <span className="sr-only">Detail</span>
                        </Button>

                        {authenticated && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(r)}
                              title="Edit Data"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDelete(r)}
                              className="text-destructive hover:text-destructive h-8 w-8 p-0"
                              title="Hapus Data"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Hapus</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* MODAL DETAIL DATA KUALITAS AIR */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl bg-card border shadow-xl">
          <DialogHeader>
            <div className="flex items-center justify-between pr-4">
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Droplets className="h-5 w-5 text-primary" />
                <span>Detail Parameter Kualitas Air &mdash; {detailRecord?.record_code}</span>
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Event Sampling: <strong className="text-foreground">{detailRecord?.sampling_code}</strong> | Stasiun: <strong className="text-foreground">{detailRecord?.station_name}</strong> ({detailRecord?.city})
            </DialogDescription>
          </DialogHeader>

          {detailRecord && (
            <div className="space-y-4 py-2 text-xs">
              {/* Info Utama */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/50">
                <div>
                  <span className="text-muted-foreground block">Tanggal:</span>
                  <span className="font-semibold text-foreground">{formatIndoDate(detailRecord.sampling_date)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Waktu:</span>
                  <span className="font-semibold text-foreground">{detailRecord.sampling_time || "-"} WIB</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Kondisi Cuaca:</span>
                  <span className="font-semibold text-foreground">{detailRecord.weather_condition || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Tautan HABs:</span>
                  <span className="font-semibold text-foreground">{detailRecord.linked_bloom_events_count} kejadian</span>
                </div>
              </div>

              {/* Parameter Fisika Standar */}
              <div>
                <h4 className="font-bold text-foreground flex items-center gap-1.5 mb-2">
                  <Compass className="h-4 w-4 text-primary" />
                  Parameter Fisika Dasar
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-lg border bg-card">
                    <span className="text-muted-foreground block text-[11px]">Suhu Air</span>
                    <span className="text-base font-bold font-mono text-primary">
                      {detailRecord.temperature_c !== null ? `${Number(detailRecord.temperature_c).toFixed(2)} °C` : "-"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-card">
                    <span className="text-muted-foreground block text-[11px]">Salinitas</span>
                    <span className="text-base font-bold font-mono text-foreground">
                      {detailRecord.salinity_psu !== null ? `${Number(detailRecord.salinity_psu).toFixed(2)} PSU` : "-"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-card">
                    <span className="text-muted-foreground block text-[11px]">Dissolved Oxygen (DO)</span>
                    <span className="text-base font-bold font-mono text-foreground">
                      {detailRecord.dissolved_oxygen_mgl !== null ? `${Number(detailRecord.dissolved_oxygen_mgl).toFixed(2)} mg/L` : "-"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-card">
                    <span className="text-muted-foreground block text-[11px]">Derajat Keasaman (pH)</span>
                    <span className="text-base font-bold font-mono text-foreground">
                      {detailRecord.ph !== null ? `${Number(detailRecord.ph).toFixed(2)}` : "-"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-card">
                    <span className="text-muted-foreground block text-[11px]">Klorofil-a</span>
                    <span className="text-base font-bold font-mono text-foreground">
                      {detailRecord.chlorophyll_a_ugl !== null ? `${Number(detailRecord.chlorophyll_a_ugl).toFixed(2)} µg/L` : "-"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-card">
                    <span className="text-muted-foreground block text-[11px]">Kekeruhan (Turbidity)</span>
                    <span className="text-base font-bold font-mono text-foreground">
                      {detailRecord.turbidity_ntu !== null ? `${Number(detailRecord.turbidity_ntu).toFixed(2)} NTU` : "-"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-card">
                    <span className="text-muted-foreground block text-[11px]">Kecepatan Arus</span>
                    <span className="text-base font-bold font-mono text-foreground">
                      {detailRecord.current_speed_ms !== null ? `${Number(detailRecord.current_speed_ms).toFixed(2)} m/s` : "-"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-card">
                    <span className="text-muted-foreground block text-[11px]">Kedalaman Ukur</span>
                    <span className="text-base font-bold font-mono text-foreground">
                      {detailRecord.depth_m !== null ? `${Number(detailRecord.depth_m).toFixed(2)} m` : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Parameter Lanjutan (Logbook Lapangan) */}
              <div>
                <h4 className="font-bold text-foreground flex items-center gap-1.5 mb-2">
                  <FlaskConical className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Parameter Fisika-Kimia & Nutrien Lanjutan
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg border bg-card">
                    <span className="text-muted-foreground block text-[11px]">Total Dissolved Solids (TDS)</span>
                    <span className="text-sm font-bold font-mono text-foreground">
                      {detailRecord.tds_gl !== null && detailRecord.tds_gl !== undefined ? `${Number(detailRecord.tds_gl).toFixed(2)} g/L` : "-"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-card">
                    <span className="text-muted-foreground block text-[11px]">Konduktivitas Listrik</span>
                    <span className="text-sm font-bold font-mono text-foreground">
                      {detailRecord.conductivity_ms_cm !== null && detailRecord.conductivity_ms_cm !== undefined ? `${Number(detailRecord.conductivity_ms_cm).toFixed(2)} mS/cm` : "-"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-card">
                    <span className="text-muted-foreground block text-[11px]">Anomali Densitas (σt)</span>
                    <span className="text-sm font-bold font-mono text-foreground">
                      {detailRecord.sigma_t !== null && detailRecord.sigma_t !== undefined ? `${Number(detailRecord.sigma_t).toFixed(2)}` : "-"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-card">
                    <span className="text-muted-foreground block text-[11px]">Potensial Redoks (ORP)</span>
                    <span className="text-sm font-bold font-mono text-foreground">
                      {detailRecord.orp_mv !== null && detailRecord.orp_mv !== undefined ? `${Number(detailRecord.orp_mv).toFixed(1)} mV` : "-"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-card">
                    <span className="text-muted-foreground block text-[11px]">Potensial pH (pHmV)</span>
                    <span className="text-sm font-bold font-mono text-foreground">
                      {detailRecord.ph_mv !== null && detailRecord.ph_mv !== undefined ? `${Number(detailRecord.ph_mv).toFixed(1)} mV` : "-"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-card">
                    <span className="text-muted-foreground block text-[11px]">Nitrat (NO₃)</span>
                    <span className="text-sm font-bold font-mono text-foreground">
                      {detailRecord.nitrate_no3_mgl !== null && detailRecord.nitrate_no3_mgl !== undefined ? `${Number(detailRecord.nitrate_no3_mgl).toFixed(2)} mg/L` : "-"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-card">
                    <span className="text-muted-foreground block text-[11px]">Nitrit (NO₂) / Sekunder</span>
                    <span className="text-sm font-bold font-mono text-foreground">
                      {detailRecord.nitrite_no2_mgl !== null && detailRecord.nitrite_no2_mgl !== undefined ? `${Number(detailRecord.nitrite_no2_mgl).toFixed(2)} mg/L` : "-"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-card">
                    <span className="text-muted-foreground block text-[11px]">Total Fosfor (P)</span>
                    <span className="text-sm font-bold font-mono text-foreground">
                      {detailRecord.phosphorus_p_mgl !== null && detailRecord.phosphorus_p_mgl !== undefined ? `${Number(detailRecord.phosphorus_p_mgl).toFixed(2)} mg/L` : "-"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-card">
                    <span className="text-muted-foreground block text-[11px]">Ortofosfat (PO₄)</span>
                    <span className="text-sm font-bold font-mono text-foreground">
                      {detailRecord.phosphate_po4_mgl !== null && detailRecord.phosphate_po4_mgl !== undefined ? `${Number(detailRecord.phosphate_po4_mgl).toFixed(2)} mg/L` : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Catatan Lapangan */}
              {detailRecord.notes && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-muted-foreground font-semibold block mb-1">Catatan Lapangan & Lokasi:</span>
                  <p className="text-foreground leading-relaxed">{detailRecord.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog Add/Edit Data */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-primary" />
                {isEditing ? "Edit Data Parameter Kualitas Air" : "Tambah Data Parameter Kualitas Air"}
              </DialogTitle>
              <DialogDescription>
                Lengkapi formulir parameter pengukuran oseanografi di bawah ini.
              </DialogDescription>
            </DialogHeader>

            {formError && (
              <div className="p-3 my-2 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4 py-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="record_code">Kode Rekord Kualitas Air *</Label>
                  <Input
                    id="record_code"
                    placeholder="misal: WQ-104 atau WQ-2026-BARON"
                    value={formData.record_code}
                    onChange={(e) =>
                      setFormData({ ...formData, record_code: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sampling_event_id">Sampling Event Terkait *</Label>
                  <Select
                    value={formData.sampling_event_id}
                    onValueChange={(val) =>
                      setFormData({ ...formData, sampling_event_id: val || "" })
                    }
                  >
                    <SelectTrigger id="sampling_event_id" className="text-xs">
                      <SelectValue placeholder="Pilih Sampling Event..." />
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

              {/* Parameter Fisika Dasar */}
              <div className="rounded-lg border p-3 bg-muted/20 space-y-3">
                <h4 className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                  <Compass className="h-3.5 w-3.5 text-primary" />
                  Parameter Fisika Dasar
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="temperature_c">Suhu (°C)</Label>
                    <Input
                      id="temperature_c"
                      type="number"
                      step="0.01"
                      placeholder="26.5"
                      value={formData.temperature_c}
                      onChange={(e) =>
                        setFormData({ ...formData, temperature_c: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="salinity_psu">Salinitas (PSU/ppt)</Label>
                    <Input
                      id="salinity_psu"
                      type="number"
                      step="0.01"
                      placeholder="32.0"
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
                      placeholder="8.1"
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
                      placeholder="5.4"
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
                      placeholder="12.5"
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
                      placeholder="2.1"
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
                      placeholder="0.25"
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
                      placeholder="1.0"
                      value={formData.depth_m}
                      onChange={(e) =>
                        setFormData({ ...formData, depth_m: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Toggle Parameter Lanjutan */}
              <div className="border rounded-lg p-3 bg-muted/10">
                <button
                  type="button"
                  onClick={() => setShowExtendedParams(!showExtendedParams)}
                  className="flex items-center justify-between w-full font-bold text-foreground text-xs hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <FlaskConical className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Parameter Lanjutan (TDS, ORP, Konduktivitas & Nutrien)
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {showExtendedParams ? "Sembunyikan" : "Tampilkan"}
                  </Badge>
                </button>

                {showExtendedParams && (
                  <div className="mt-3 pt-3 border-t space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="tds_gl">TDS (g/L)</Label>
                        <Input
                          id="tds_gl"
                          type="number"
                          step="0.01"
                          placeholder="misal: 18.6"
                          value={formData.tds_gl}
                          onChange={(e) => setFormData({ ...formData, tds_gl: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="conductivity_ms_cm">Konduktivitas (mS/cm)</Label>
                        <Input
                          id="conductivity_ms_cm"
                          type="number"
                          step="0.01"
                          placeholder="misal: 30.0"
                          value={formData.conductivity_ms_cm}
                          onChange={(e) => setFormData({ ...formData, conductivity_ms_cm: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="sigma_t">Sigma-t (σt)</Label>
                        <Input
                          id="sigma_t"
                          type="number"
                          step="0.01"
                          placeholder="misal: 10.7"
                          value={formData.sigma_t}
                          onChange={(e) => setFormData({ ...formData, sigma_t: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="orp_mv">Potensial Redoks / ORP (mV)</Label>
                        <Input
                          id="orp_mv"
                          type="number"
                          step="0.1"
                          placeholder="misal: 122"
                          value={formData.orp_mv}
                          onChange={(e) => setFormData({ ...formData, orp_mv: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="ph_mv">Potensial pH (pHmV)</Label>
                        <Input
                          id="ph_mv"
                          type="number"
                          step="0.1"
                          placeholder="misal: -71"
                          value={formData.ph_mv}
                          onChange={(e) => setFormData({ ...formData, ph_mv: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="space-y-1.5">
                        <Label htmlFor="nitrate_no3_mgl">Nitrat NO₃ (mg/L)</Label>
                        <Input
                          id="nitrate_no3_mgl"
                          type="number"
                          step="0.01"
                          placeholder="misal: 8.9"
                          value={formData.nitrate_no3_mgl}
                          onChange={(e) => setFormData({ ...formData, nitrate_no3_mgl: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="nitrite_no2_mgl">Nitrit NO₂ (mg/L)</Label>
                        <Input
                          id="nitrite_no2_mgl"
                          type="number"
                          step="0.01"
                          placeholder="misal: 2.0"
                          value={formData.nitrite_no2_mgl}
                          onChange={(e) => setFormData({ ...formData, nitrite_no2_mgl: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="phosphorus_p_mgl">Fosfor P (mg/L)</Label>
                        <Input
                          id="phosphorus_p_mgl"
                          type="number"
                          step="0.01"
                          placeholder="misal: 0.3"
                          value={formData.phosphorus_p_mgl}
                          onChange={(e) => setFormData({ ...formData, phosphorus_p_mgl: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="phosphate_po4_mgl">Ortofosfat PO₄ (mg/L)</Label>
                        <Input
                          id="phosphate_po4_mgl"
                          type="number"
                          step="0.01"
                          placeholder="misal: 0.8"
                          value={formData.phosphate_po4_mgl}
                          onChange={(e) => setFormData({ ...formData, phosphate_po4_mgl: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Catatan Lapangan & Lokasi</Label>
                <Input
                  id="notes"
                  placeholder="Nama pantai, titik koordinat, kondisi cuaca, atau pengamatan sensor..."
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

      {/* Modal Dialog Bulk Excel & CSV Upload */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleUploadSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Unggah Berkas Kualitas Air (Excel / CSV)
              </DialogTitle>
              <DialogDescription>
                Unggah file spreadsheet .xlsx, .xls, atau .csv. Sistem secara otomatis mengenali format logbook oseanografi lapangan maupun tabel standar.
              </DialogDescription>
            </DialogHeader>

            {/* Template Download Prompt */}
            <div className="p-3 my-2 text-xs rounded-lg bg-primary/10 border border-primary/20 text-foreground flex items-start gap-2.5">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <p className="font-semibold text-primary">Panduan & Template Format Berkas:</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Gunakan format resmi agar data otomatis terpetakan ke parameter fisika, kimia, dan nutrien.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh Template Excel Resmi (.xlsx)
                </button>
              </div>
            </div>

            {/* Target Stasiun Selector (untuk Logbook Lapangan) */}
            <div className="space-y-1.5 my-2">
              <Label htmlFor="upload_station" className="text-xs font-bold text-foreground">
                Target Stasiun Monitoring (Opsional)
              </Label>
              <Select value={uploadTargetStation} onValueChange={(val) => setUploadTargetStation(val || "all")}>
                <SelectTrigger id="upload_station" className="h-9 text-xs">
                  <SelectValue placeholder="Pilih Stasiun..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Otomatis / Default (ST-03 Pesisir Selatan Jawa)</SelectItem>
                  {stationOptions.map((st) => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.station_code} - {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Jika file logbook Anda tidak mencantumkan kode sampling, data akan diasosiasikan dengan stasiun ini.
              </p>
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

            <div className="py-2">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 transition-colors bg-muted/20 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">
                  {uploadFile ? uploadFile.name : "Pilih atau Seret Berkas Spreadsheet ke Sini"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {uploadFile
                    ? `${(uploadFile.size / 1024).toFixed(1)} KB`
                    : "Mendukung format .xlsx, .xls, atau .csv (Maksimal 10 MB)"}
                </p>
                <label className="mt-3 inline-flex items-center justify-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs">
                  Pilih Berkas
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
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

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteSubmitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteSubmit}
              disabled={deleteSubmitting}
            >
              {deleteSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, Hapus Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
