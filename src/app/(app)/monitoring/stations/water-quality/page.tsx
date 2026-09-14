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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MapPin,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

interface WaterQualityRecord {
  id: string
  record_code: string
  sampling_event_id: string | null
  station_id: string | null
  beach_id?: string | null
  beach_name?: string | null
  data_source_type?: string | null
  source_title?: string | null
  source_url?: string | null
  latitude?: number | string | null
  longitude?: number | string | null
  sampling_code: string
  sampling_date: string
  sampling_time: string | null
  weather_condition: string | null
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
  station_id?: string
  beach_id?: string | null
  station_name: string
  station_code: string
}

interface StationOption {
  id: string
  station_code: string
  name: string
  city?: string
}

interface BeachOption {
  id: string
  station_id: string
  name: string
  village?: string
  subdistrict?: string
  regency?: string
  latitude?: number | string | null
  longitude?: number | string | null
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
  station_id: "",
  beach_id: "",
  data_source_type: "Hasil Sampling",
  source_title: "",
  source_url: "",
  latitude: "",
  longitude: "",
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
  const [yearFilter, setYearFilter] = React.useState("all")

  // Sorting State
  const [sortField, setSortField] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc")

  // Options
  const [samplingOptions, setSamplingOptions] = React.useState<SamplingOption[]>([])
  const [stationOptions, setStationOptions] = React.useState<StationOption[]>([])
  const [beachOptions, setBeachOptions] = React.useState<BeachOption[]>([])

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
  const [isUploadSuccessOpen, setIsUploadSuccessOpen] = React.useState(false)

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
      if (yearFilter !== "all") params.append("year", yearFilter)

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
  }, [searchQuery, stationFilter, yearFilter])

  const fetchOptions = React.useCallback(async () => {
    try {
      const res = await fetch("/api/water-quality/options")
      const data = await res.json()
      if (data.success && data.data) {
        setSamplingOptions(data.data.sampling_events || [])
        setStationOptions(data.data.stations || [])
        setBeachOptions(data.data.beaches || [])
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

  // Compute available years for the year filter
  const availableYears = React.useMemo(() => {
    const currentYear = new Date().getFullYear()
    const years = new Set<number>([currentYear, currentYear - 1, currentYear - 2])
    records.forEach((r) => {
      if (r.sampling_date) {
        const y = parseInt(r.sampling_date.split("-")[0], 10)
        if (!isNaN(y)) years.add(y)
      }
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [records])

  // Sorting Handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedRecords = React.useMemo(() => {
    if (!sortField) return records
    return [...records].sort((a, b) => {
      let aVal: unknown = a[sortField as keyof WaterQualityRecord]
      let bVal: unknown = b[sortField as keyof WaterQualityRecord]

      if (sortField === "data_source_type") {
        aVal = a.source_title || a.sampling_code || a.data_source_type || ""
        bVal = b.source_title || b.sampling_code || b.data_source_type || ""
      }

      if (aVal === null || aVal === undefined || aVal === "") return 1
      if (bVal === null || bVal === undefined || bVal === "") return -1

      let comp = 0
      const aNum = Number(aVal)
      const bNum = Number(bVal)
      if (!isNaN(aNum) && !isNaN(bNum) && typeof aVal !== "boolean" && typeof bVal !== "boolean") {
        comp = aNum - bNum
      } else {
        comp = String(aVal).localeCompare(String(bVal), "id", { numeric: true })
      }

      return sortDirection === "asc" ? comp : -comp
    })
  }, [records, sortField, sortDirection])

  const handleOpenAdd = () => {
    fetchOptions()
    setIsEditing(false)
    setEditingId(null)
    setFormData({
      ...initialFormData,
      record_code: `WQ-${Date.now().toString().slice(-4)}`,
      sampling_event_id: "",
      station_id: stationOptions[0]?.id || "",
      beach_id: "",
      data_source_type: "Hasil Sampling",
      source_title: "",
      source_url: "",
      latitude: "",
      longitude: "",
    })
    setShowExtendedParams(false)
    setFormError(null)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (rec: WaterQualityRecord) => {
    fetchOptions()
    setIsEditing(true)
    setEditingId(rec.id)
    let srcType = rec.data_source_type || "Hasil Sampling"
    if (srcType === "Jurnal / Publikasi") srcType = "Artikel Jurnal"
    if (srcType !== "Hasil Sampling" && srcType !== "Artikel Jurnal" && srcType !== "Lainnya") {
      srcType = "Lainnya"
    }

    setFormData({
      record_code: rec.record_code,
      sampling_event_id: rec.sampling_event_id || "",
      station_id: rec.station_id || "",
      beach_id: rec.beach_id || "",
      data_source_type: srcType,
      source_title: rec.source_title || "",
      source_url: rec.source_url || "",
      latitude: rec.latitude !== null && rec.latitude !== undefined ? String(rec.latitude) : "",
      longitude: rec.longitude !== null && rec.longitude !== undefined ? String(rec.longitude) : "",
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
        sampling_event_id: formData.data_source_type === "Hasil Sampling" ? (formData.sampling_event_id || null) : null,
        station_id: formData.station_id || null,
        beach_id: formData.beach_id || null,
        data_source_type: formData.data_source_type,
        source_title: formData.source_title.trim() || null,
        source_url: formData.source_url.trim() || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
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
          ? `Data ${formData.record_code} berhasil diperbarui.`
          : `Data ${formData.record_code} berhasil ditambahkan.`
      )
      fetchRecords()
    } catch (err) {
      console.error("Error submitting form:", err)
      setFormError("Terjadi kesalahan koneksi saat menyimpan data.")
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
      showBanner("success", `Data ${deletingRecord.record_code} berhasil dihapus.`)
      fetchRecords()
    } catch (err) {
      console.error("Error deleting record:", err)
      setDeleteError("Terjadi kesalahan koneksi saat menghapus data.")
    } finally {
      setDeleteSubmitting(false)
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile) {
      setUploadError("Silakan pilih file spreadsheet yang akan diunggah.")
      return
    }

    setUploadError(null)
    setUploadResult(null)
    setUploadSubmitting(true)

    try {
      const formDataUpload = new FormData()
      formDataUpload.append("file", uploadFile)
      if (uploadTargetStation && uploadTargetStation !== "all") {
        formDataUpload.append("station_id", uploadTargetStation)
      }

      const res = await fetch("/api/water-quality/upload", {
        method: "POST",
        body: formDataUpload,
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setUploadError(data.error || "Gagal memproses file upload.")
        setUploadSubmitting(false)
        return
      }

      setUploadResult({
        message: data.message || "Upload berhasil!",
        total: data.data?.total || 0,
        inserted: data.data?.inserted || 0,
        updated: data.data?.updated || 0,
        errors: data.data?.errors || 0,
        failed: data.data?.failed || [],
      })

      // Tutup form modal upload dan bersihkan file
      setIsUploadOpen(false)
      setUploadFile(null)

      // Tampilkan pop up sukses
      setIsUploadSuccessOpen(true)

      showBanner("success", data.message || "File berhasil diimpor!")
      fetchRecords()
    } catch (err) {
      console.error("Error uploading file:", err)
      setUploadError("Terjadi kesalahan jaringan saat mengunggah file.")
    } finally {
      setUploadSubmitting(false)
    }
  }

  const handleDownloadTemplate = () => {
    window.open("/api/water-quality/download-template", "_blank")
  }

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {banner && (
        <div
          className={cn(
            "p-4 rounded-xl border text-sm font-medium flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-200",
            banner.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          )}
        >
          <div className="flex items-center gap-2">
            {banner.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0" />
            )}
            <span>{banner.message}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBanner(null)}
            className="h-6 w-6 p-0 text-current hover:bg-transparent"
          >
            &times;
          </Button>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl border bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                Oseanografi & Parameter Kualitas Air
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Droplets className="h-6 w-6 text-primary" />
              Monitoring Kualitas Air
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Data parameter oseanografi fisika, kimia, dan nutrien pesisir laut & stasiun pemantauan.
            </p>
          </div>

          <div className="flex items-center gap-2">
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
                    fetchOptions()
                    setUploadFile(null)
                    setUploadError(null)
                    setUploadResult(null)
                    setIsUploadOpen(true)
                  }}
                  className="text-xs font-semibold shadow-xs"
                >
                  <Upload className="mr-1.5 h-4 w-4 text-primary" />
                  Upload
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
            placeholder="Cari kode WQ, kode sampling, stasiun, pantai, atau catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Filter Stasiun */}
          <Select value={stationFilter} onValueChange={(val) => setStationFilter(val || "all")}>
            <SelectTrigger className="w-full sm:w-[260px] md:w-[280px] h-9 text-xs font-semibold">
              <SelectValue placeholder="Semua Stasiun">
                {stationFilter === "all"
                  ? "Semua Stasiun"
                  : (stationOptions.find((st) => st.id === stationFilter)?.name || "Semua Stasiun")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="z-50 min-w-[280px]">
              <SelectItem value="all">Semua Stasiun</SelectItem>
              {stationOptions.map((st) => (
                <SelectItem key={st.id} value={st.id}>
                  {st.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter Tahun */}
          <Select value={yearFilter} onValueChange={(val) => setYearFilter(val || "all")}>
            <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs font-semibold">
              <SelectValue placeholder="Semua Tahun">
                {yearFilter === "all" ? "Semua Tahun" : `Tahun ${yearFilter}`}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="all">Semua Tahun</SelectItem>
              {availableYears.map((yr) => (
                <SelectItem key={yr} value={String(yr)}>
                  Tahun {yr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">
                <button
                  onClick={() => handleSort("record_code")}
                  className="flex items-center gap-1 font-bold text-foreground hover:text-primary transition-colors cursor-pointer text-xs"
                >
                  Kode WQ
                  {sortField === "record_code" ? (
                    sortDirection === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("data_source_type")}
                  className="flex items-center gap-1 font-bold text-foreground hover:text-primary transition-colors cursor-pointer text-xs"
                >
                  Sumber Data
                  {sortField === "data_source_type" ? (
                    sortDirection === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("station_name")}
                  className="flex items-center gap-1 font-bold text-foreground hover:text-primary transition-colors cursor-pointer text-xs"
                >
                  Stasiun / Pantai
                  {sortField === "station_name" ? (
                    sortDirection === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                  )}
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort("temperature_c")}
                  className="ml-auto flex items-center justify-end gap-1 font-bold text-foreground hover:text-primary transition-colors cursor-pointer text-xs"
                >
                  Suhu (°C)
                  {sortField === "temperature_c" ? (
                    sortDirection === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                  )}
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort("salinity_psu")}
                  className="ml-auto flex items-center justify-end gap-1 font-bold text-foreground hover:text-primary transition-colors cursor-pointer text-xs"
                >
                  Sal (PSU)
                  {sortField === "salinity_psu" ? (
                    sortDirection === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                  )}
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort("dissolved_oxygen_mgl")}
                  className="ml-auto flex items-center justify-end gap-1 font-bold text-foreground hover:text-primary transition-colors cursor-pointer text-xs"
                >
                  DO (mg/L)
                  {sortField === "dissolved_oxygen_mgl" ? (
                    sortDirection === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                  )}
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort("ph")}
                  className="ml-auto flex items-center justify-end gap-1 font-bold text-foreground hover:text-primary transition-colors cursor-pointer text-xs"
                >
                  pH
                  {sortField === "ph" ? (
                    sortDirection === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                  )}
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort("tds_gl")}
                  className="ml-auto flex items-center justify-end gap-1 font-bold text-foreground hover:text-primary transition-colors cursor-pointer text-xs"
                >
                  TDS (g/L)
                  {sortField === "tds_gl" ? (
                    sortDirection === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                  )}
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort("chlorophyll_a_ugl")}
                  className="ml-auto flex items-center justify-end gap-1 font-bold text-foreground hover:text-primary transition-colors cursor-pointer text-xs"
                >
                  Klorofil-a
                  {sortField === "chlorophyll_a_ugl" ? (
                    sortDirection === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                  )}
                </button>
              </TableHead>
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
            ) : sortedRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="p-8">
                  <EmptyState
                    icon={Droplets}
                    title="Tidak ada data kualitas air"
                    description={
                      searchQuery || stationFilter !== "all"
                        ? "Tidak ditemukan data yang sesuai dengan kriteria pencarian / filter."
                        : "Belum ada rekaman parameter kualitas air dalam sistem."
                    }
                    actionLabel={authenticated ? "Tambah Data Pertama" : undefined}
                    onAction={authenticated ? handleOpenAdd : undefined}
                  />
                </TableCell>
              </TableRow>
            ) : (
              sortedRecords.map((r) => {
                const chlVal = Number(r.chlorophyll_a_ugl) || 0
                const isJournal = r.data_source_type === "Artikel Jurnal" || r.data_source_type === "Jurnal / Publikasi"
                const isOther = r.data_source_type === "Lainnya"
                return (
                  <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono font-bold text-primary">
                      <div className="flex items-center gap-1.5">
                        <Droplets className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{r.record_code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isJournal ? (
                        <div className="flex flex-col text-xs gap-0.5">
                          <Badge variant="outline" className="w-fit text-[10px] py-0 px-1.5 font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                            Artikel Jurnal
                          </Badge>
                          <span className="font-medium text-foreground line-clamp-1 max-w-[220px]" title={r.source_title || "Artikel Jurnal Ilmiah"}>
                            {r.source_title || "Referensi Artikel Jurnal"}
                          </span>
                          {r.source_url && (
                            <a
                              href={r.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-primary hover:underline font-mono truncate max-w-[200px]"
                              title={r.source_url}
                            >
                              Tautan Referensi / DOI &rarr;
                            </a>
                          )}
                        </div>
                      ) : isOther ? (
                        <div className="flex flex-col text-xs gap-0.5">
                          <Badge variant="outline" className="w-fit text-[10px] py-0 px-1.5 font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30">
                            Lainnya
                          </Badge>
                          <span className="font-medium text-foreground line-clamp-1 max-w-[220px]" title={r.source_title || "Sumber Lainnya"}>
                            {r.source_title || "Sumber Sekunder / Laporan"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col text-xs gap-0.5">
                          <Badge variant="outline" className="w-fit text-[10px] py-0 px-1.5 font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                            Hasil Sampling
                          </Badge>
                          <span className="font-mono font-semibold text-foreground">
                            {r.sampling_code && r.sampling_code !== "-" ? r.sampling_code : "Sampling Event"}
                          </span>
                          <span className="text-muted-foreground">{formatIndoDate(r.sampling_date)}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/monitoring/stations/${r.station_code || r.station_id}`}
                        className="text-xs font-semibold text-foreground hover:text-primary hover:underline transition-colors block"
                      >
                        {r.station_name}
                      </Link>
                      {r.beach_name && r.beach_name !== "-" ? (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">
                          Pantai {r.beach_name}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground block">{r.city}</span>
                      )}
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
              Stasiun: <strong className="text-foreground">{detailRecord?.station_name}</strong>
              {detailRecord?.beach_name && detailRecord?.beach_name !== "-" && (
                <> &bull; Pantai: <strong className="text-foreground">{detailRecord?.beach_name}</strong></>
              )}
              {detailRecord?.city && <> ({detailRecord?.city})</>}
            </DialogDescription>
          </DialogHeader>

          {detailRecord && (
            <div className="space-y-4 py-2 text-xs">
              {/* Info Utama Sumber Data */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/50">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Tipe Sumber Data:</span>
                  <Badge variant="outline" className="mt-0.5 text-[10px] bg-primary/10 text-primary border-primary/20">
                    {detailRecord.data_source_type || (detailRecord.sampling_event_id ? "Hasil Sampling" : "Artikel Jurnal")}
                  </Badge>
                </div>
                {detailRecord.data_source_type === "Artikel Jurnal" || detailRecord.data_source_type === "Jurnal / Publikasi" || detailRecord.data_source_type === "Lainnya" || detailRecord.source_title ? (
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground block text-[11px]">Judul / Rujukan Sumber:</span>
                    <span className="font-semibold text-foreground block">{detailRecord.source_title || "Rujukan Sumber Data"}</span>
                    {detailRecord.source_url && (
                      <a href={detailRecord.source_url} target="_blank" rel="noreferrer" className="text-primary hover:underline font-mono text-[11px] block mt-0.5">
                        {detailRecord.source_url} &rarr;
                      </a>
                    )}
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Tanggal Sampling:</span>
                      <span className="font-semibold text-foreground">{formatIndoDate(detailRecord.sampling_date)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Waktu & Cuaca:</span>
                      <span className="font-semibold text-foreground">{detailRecord.sampling_time || "-"} WIB ({detailRecord.weather_condition || "Normal"})</span>
                    </div>
                  </>
                )}
              </div>

              {/* Info Koordinat & Lokasi */}
              {(detailRecord.latitude !== null || detailRecord.longitude !== null) && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs">
                  <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-muted-foreground">Koordinat Geografis:</span>
                  <span className="font-mono font-bold text-foreground">
                    Lat: {detailRecord.latitude ?? "-"}, Long: {detailRecord.longitude ?? "-"}
                  </span>
                </div>
              )}

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
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-bold text-base">
                <Droplets className="h-5 w-5 text-primary" />
                {isEditing ? "Edit Data Parameter Kualitas Air" : "Tambah Data Parameter Kualitas Air"}
              </DialogTitle>
              <DialogDescription className="text-xs">
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
              {/* Section 1: Identitas & Sumber Data */}
              <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
                <h4 className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                  Identitas Rekord & Sumber Data
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="record_code" className="text-xs font-semibold">Kode Rekord Kualitas Air *</Label>
                    <Input
                      id="record_code"
                      placeholder="misal: WQ-104 atau WQ-2026-BARON"
                      value={formData.record_code}
                      onChange={(e) =>
                        setFormData({ ...formData, record_code: e.target.value })
                      }
                      className="h-10 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="data_source_type" className="text-xs font-semibold">Sumber Data *</Label>
                    <Select
                      value={formData.data_source_type}
                      onValueChange={(val) =>
                        setFormData({ ...formData, data_source_type: val || "Hasil Sampling" })
                      }
                    >
                      <SelectTrigger id="data_source_type" className="w-full h-10 text-xs font-medium px-3">
                        <SelectValue placeholder="Pilih Sumber Data...">
                          {formData.data_source_type}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="z-[70] max-h-60 overflow-y-auto min-w-[200px]">
                        <SelectItem value="Hasil Sampling" className="text-xs py-2">Hasil Sampling</SelectItem>
                        <SelectItem value="Artikel Jurnal" className="text-xs py-2">Artikel Jurnal</SelectItem>
                        <SelectItem value="Lainnya" className="text-xs py-2">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Conditional Inputs based on Data Source */}
                {formData.data_source_type === "Hasil Sampling" ? (
                  <div className="space-y-1.5 pt-1">
                    <Label htmlFor="sampling_event_id" className="text-xs font-semibold">Sampling Event Terkait *</Label>
                    <Select
                      value={formData.sampling_event_id || "none"}
                      onValueChange={(val) => {
                        const chosenVal = val === "none" ? "" : (val || "")
                        const selEvent = samplingOptions.find(s => s.id === chosenVal)
                        setFormData(prev => ({
                          ...prev,
                          sampling_event_id: chosenVal,
                          station_id: selEvent?.station_id || prev.station_id,
                          beach_id: prev.beach_id,
                        }))
                      }}
                    >
                      <SelectTrigger id="sampling_event_id" className="w-full h-10 text-xs font-medium px-3 text-left">
                        <SelectValue placeholder="Pilih Sampling Event...">
                          {(() => {
                            const found = samplingOptions.find(s => s.id === formData.sampling_event_id)
                            return found ? `${found.sampling_code} — ${found.station_name} (${formatIndoDate(found.sampling_date)})` : "-- Pilih Sampling Event --"
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="z-[70] max-h-64 overflow-y-auto w-[max(var(--anchor-width),460px)] min-w-full">
                        <SelectItem value="none" className="text-xs py-2">-- Pilih Sampling Event --</SelectItem>
                        {samplingOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id} className="text-xs py-2">
                            {opt.sampling_code} &mdash; {opt.station_name} ({formatIndoDate(opt.sampling_date)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="source_title" className="text-xs font-semibold">Judul Referensi / Sumber *</Label>
                      <Input
                        id="source_title"
                        placeholder="misal: Jurnal Oseanografi (Prasetyo et al., 2024)"
                        value={formData.source_title}
                        onChange={(e) =>
                          setFormData({ ...formData, source_title: e.target.value })
                        }
                        className="h-10 text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="source_url" className="text-xs font-semibold">DOI / Tautan URL (Opsional)</Label>
                      <Input
                        id="source_url"
                        placeholder="misal: https://doi.org/10.1016/j.jmarsys.2024.102345"
                        value={formData.source_url}
                        onChange={(e) =>
                          setFormData({ ...formData, source_url: e.target.value })
                        }
                        className="h-10 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Stasiun & Lokasi Pantai */}
              <div className="p-3.5 rounded-lg border bg-muted/20 space-y-3.5">
                <h4 className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Stasiun Pemantauan, Lokasi Pantai & Koordinat
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="station_id" className="text-xs font-semibold">Stasiun Pemantauan *</Label>
                    <Select
                      value={formData.station_id || "none"}
                      onValueChange={(val) => {
                        const chosenVal = val === "none" ? "" : (val || "")
                        setFormData(prev => ({
                          ...prev,
                          station_id: chosenVal,
                          beach_id: prev.beach_id && beachOptions.some(b => b.id === prev.beach_id && b.station_id === chosenVal) ? prev.beach_id : "",
                        }))
                      }}
                    >
                      <SelectTrigger id="station_id" className="w-full h-10 text-xs font-medium px-3 text-left">
                        <SelectValue placeholder="Pilih Stasiun...">
                          {(() => {
                            const found = stationOptions.find((st) => st.id === formData.station_id)
                            return found ? `${found.name} (${found.city})` : "-- Pilih Stasiun --"
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="z-[70] max-h-64 overflow-y-auto w-[max(var(--anchor-width),360px)] min-w-[320px]">
                        <SelectItem value="none" className="text-xs py-2">-- Pilih Stasiun --</SelectItem>
                        {stationOptions.map((st) => (
                          <SelectItem key={st.id} value={st.id} className="text-xs py-2">
                            {st.name} ({st.city})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="beach_id" className="text-xs font-semibold">Lokasi Pantai (Opsional)</Label>
                    <Select
                      value={formData.beach_id || "none"}
                      onValueChange={(val) => {
                        const chosenVal = val === "none" ? "" : (val || "")
                        const selBeach = beachOptions.find(b => b.id === chosenVal)
                        setFormData(prev => ({
                          ...prev,
                          beach_id: chosenVal,
                          station_id: selBeach?.station_id || prev.station_id,
                          latitude: selBeach?.latitude !== null && selBeach?.latitude !== undefined ? String(selBeach.latitude) : prev.latitude,
                          longitude: selBeach?.longitude !== null && selBeach?.longitude !== undefined ? String(selBeach.longitude) : prev.longitude,
                        }))
                      }}
                    >
                      <SelectTrigger id="beach_id" className="w-full h-10 text-xs font-medium px-3 text-left">
                        <SelectValue placeholder="Pilih Pantai (Opsional)...">
                          {(() => {
                            const found = beachOptions.find((b) => b.id === formData.beach_id)
                            return found ? `Pantai ${found.name}${found.regency ? ` (${found.regency})` : ""}` : "-- Tanpa Spesifik Pantai --"
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="z-[70] max-h-64 overflow-y-auto w-[max(var(--anchor-width),360px)] min-w-[320px]">
                        <SelectItem value="none" className="text-xs py-2">-- Tanpa Spesifik Pantai --</SelectItem>
                        {beachOptions
                          .filter(b => !formData.station_id || b.station_id === formData.station_id)
                          .map((b) => (
                            <SelectItem key={b.id} value={b.id} className="text-xs py-2">
                              Pantai {b.name}{b.regency ? ` (${b.regency})` : ""}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Fields khusus Koordinat */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="latitude" className="text-xs font-semibold">Latitude (Opsional)</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="0.000001"
                      placeholder="misal: -8.131100"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="longitude" className="text-xs font-semibold">Longitude (Opsional)</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="0.000001"
                      placeholder="misal: 110.548900"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="h-9 text-xs font-mono"
                    />
                  </div>
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
                  <SelectValue placeholder="Pilih Stasiun...">
                    {uploadTargetStation === "all"
                      ? "Otomatis / Default (ST-03 Pesisir Selatan Jawa)"
                      : (stationOptions.find((st) => st.id === uploadTargetStation)?.name || "Pilih Stasiun...")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="z-[70] max-h-60 overflow-y-auto">
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

      {/* Pop Up Sukses Upload */}
      <Dialog open={isUploadSuccessOpen} onOpenChange={setIsUploadSuccessOpen}>
        <DialogContent className="sm:max-w-md text-center p-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-lg font-bold text-foreground">
              Unggah Berkas Berhasil!
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {uploadResult?.message || "Data kualitas air berhasil diproses dan disimpan ke sistem."}
            </DialogDescription>
          </DialogHeader>

          {uploadResult && (
            <div className="my-3 p-3.5 rounded-xl bg-muted/40 border text-left text-xs space-y-2.5">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-background border shadow-2xs">
                  <span className="text-[10px] text-muted-foreground block">Total Baris</span>
                  <span className="text-base font-bold text-foreground font-mono">{uploadResult.total}</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                  <span className="text-[10px] block opacity-80">Baru</span>
                  <span className="text-base font-bold font-mono">+{uploadResult.inserted}</span>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-2xs">
                  <span className="text-[10px] block opacity-80">Diperbarui</span>
                  <span className="text-base font-bold font-mono">{uploadResult.updated}</span>
                </div>
              </div>

              {uploadResult.errors > 0 && (
                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[11px] space-y-1">
                  <span className="font-semibold block">Catatan ({uploadResult.errors} baris dilewati/gagal):</span>
                  <ul className="list-disc pl-4 max-h-24 overflow-y-auto space-y-0.5">
                    {uploadResult.failed?.map((f, i) => (
                      <li key={i}>Baris {f.row}: {f.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="sm:justify-center mt-2">
            <Button
              onClick={() => setIsUploadSuccessOpen(false)}
              className="w-full sm:w-auto min-w-[140px] font-semibold text-xs"
            >
              Selesai & Lihat Data
            </Button>
          </DialogFooter>
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
