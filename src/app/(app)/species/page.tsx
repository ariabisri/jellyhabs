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
  Bug,
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
  BookOpen,
  Layers,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

interface PlanktonRecord {
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
  species_id: string
  species_code: string
  scientific_name: string
  common_name: string | null
  organism_category: "Fitoplankton" | "Zooplankton" | "Ubur-ubur"
  is_toxic: boolean
  density_value: number | string
  density_unit: string
  toxicity_status: string
  morphological_notes: string | null
  created_at: string
  linked_bloom_events_count: number
}

interface SpeciesMaster {
  id: string
  species_code: string
  scientific_name: string
  common_name: string | null
  organism_category: "Fitoplankton" | "Zooplankton" | "Ubur-ubur"
  is_toxic: boolean
  family: string | null
  genus: string | null
  description: string | null
  records_count: number
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

const initialRecordForm = {
  record_code: "",
  sampling_event_id: "",
  species_id: "",
  density_value: "",
  density_unit: "sel/L",
  toxicity_status: "Tidak Beracun",
  morphological_notes: "",
}

const initialSpeciesForm = {
  species_code: "",
  scientific_name: "",
  common_name: "",
  organism_category: "Fitoplankton" as "Fitoplankton" | "Zooplankton" | "Ubur-ubur",
  is_toxic: false,
  family: "",
  genus: "",
  description: "",
}

export default function SpeciesPage() {
  const { authenticated } = useAuth()

  const [activeTab, setActiveTab] = React.useState("monitoring")

  // Records state
  const [records, setRecords] = React.useState<PlanktonRecord[]>([])
  const [recordsLoading, setRecordsLoading] = React.useState(true)
  const [recordSearch, setRecordSearch] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [stationFilter, setStationFilter] = React.useState("all")
  const [toxicityFilter, setToxicityFilter] = React.useState("all")

  // Species master state
  const [speciesList, setSpeciesList] = React.useState<SpeciesMaster[]>([])
  const [speciesLoading, setSpeciesLoading] = React.useState(true)
  const [speciesSearch, setSpeciesSearch] = React.useState("")
  const [speciesCategoryFilter, setSpeciesCategoryFilter] = React.useState("all")

  // Form options
  const [samplingOptions, setSamplingOptions] = React.useState<SamplingOption[]>([])
  const [stationOptions, setStationOptions] = React.useState<StationOption[]>([])
  const [speciesOptions, setSpeciesOptions] = React.useState<SpeciesMaster[]>([])

  // Record Form Dialog
  const [isRecordDialogOpen, setIsRecordDialogOpen] = React.useState(false)
  const [isEditingRecord, setIsEditingRecord] = React.useState(false)
  const [editingRecordId, setEditingRecordId] = React.useState<string | null>(null)
  const [recordFormData, setRecordFormData] = React.useState(initialRecordForm)
  const [recordSubmitting, setRecordSubmitting] = React.useState(false)
  const [recordFormError, setRecordFormError] = React.useState<string | null>(null)

  // Species Master Form Dialog
  const [isSpeciesDialogOpen, setIsSpeciesDialogOpen] = React.useState(false)
  const [isEditingSpecies, setIsEditingSpecies] = React.useState(false)
  const [editingSpeciesId, setEditingSpeciesId] = React.useState<string | null>(null)
  const [speciesFormData, setSpeciesFormData] = React.useState(initialSpeciesForm)
  const [speciesSubmitting, setSpeciesSubmitting] = React.useState(false)
  const [speciesFormError, setSpeciesFormError] = React.useState<string | null>(null)

  // Upload CSV Dialog
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

  // Delete Dialog (Record)
  const [isDeleteRecordOpen, setIsDeleteRecordOpen] = React.useState(false)
  const [deletingRecord, setDeletingRecord] = React.useState<PlanktonRecord | null>(null)
  const [deleteRecordSubmitting, setDeleteRecordSubmitting] = React.useState(false)
  const [deleteRecordError, setDeleteRecordError] = React.useState<string | null>(null)

  // Delete Dialog (Species)
  const [isDeleteSpeciesOpen, setIsDeleteSpeciesOpen] = React.useState(false)
  const [deletingSpecies, setDeletingSpecies] = React.useState<SpeciesMaster | null>(null)
  const [deleteSpeciesSubmitting, setDeleteSpeciesSubmitting] = React.useState(false)
  const [deleteSpeciesError, setDeleteSpeciesError] = React.useState<string | null>(null)

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

  // Fetch Plankton Records
  const fetchRecords = React.useCallback(async () => {
    try {
      setRecordsLoading(true)
      const params = new URLSearchParams()
      if (recordSearch.trim()) params.append("q", recordSearch.trim())
      if (categoryFilter !== "all") params.append("category", categoryFilter)
      if (stationFilter !== "all") params.append("station_id", stationFilter)
      if (toxicityFilter !== "all") params.append("toxicity_status", toxicityFilter)

      const res = await fetch(`/api/plankton?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setRecords(data.data)
      } else {
        showBanner("error", data.error || "Gagal memuat data rekaman plankton")
      }
    } catch (err) {
      console.error("Error fetching plankton records:", err)
      showBanner("error", "Terjadi kesalahan jaringan saat memuat data")
    } finally {
      setRecordsLoading(false)
    }
  }, [recordSearch, categoryFilter, stationFilter, toxicityFilter])

  // Fetch Species Master
  const fetchSpecies = React.useCallback(async () => {
    try {
      setSpeciesLoading(true)
      const params = new URLSearchParams()
      if (speciesSearch.trim()) params.append("q", speciesSearch.trim())
      if (speciesCategoryFilter !== "all") params.append("category", speciesCategoryFilter)

      const res = await fetch(`/api/species?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setSpeciesList(data.data)
        setSpeciesOptions(data.data)
      } else {
        showBanner("error", data.error || "Gagal memuat katalog spesies")
      }
    } catch (err) {
      console.error("Error fetching species list:", err)
    } finally {
      setSpeciesLoading(false)
    }
  }, [speciesSearch, speciesCategoryFilter])

  // Fetch Dropdown Options
  const fetchOptions = React.useCallback(async () => {
    try {
      const res = await fetch("/api/plankton/options")
      const data = await res.json()
      if (data.success && data.data) {
        setSamplingOptions(data.data.sampling_events || [])
        setStationOptions(data.data.stations || [])
        setSpeciesOptions(data.data.species || [])
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
    const timer = setTimeout(() => {
      fetchSpecies()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchSpecies])

  React.useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  // Record Handlers
  const handleOpenAddRecord = () => {
    setIsEditingRecord(false)
    setEditingRecordId(null)
    setRecordFormData({
      ...initialRecordForm,
      record_code: `PLK-${Date.now().toString().slice(-4)}`,
      sampling_event_id: samplingOptions[0]?.id || "",
      species_id: speciesOptions[0]?.id || "",
    })
    setRecordFormError(null)
    setIsRecordDialogOpen(true)
  }

  const handleOpenEditRecord = (rec: PlanktonRecord) => {
    setIsEditingRecord(true)
    setEditingRecordId(rec.id)
    setRecordFormData({
      record_code: rec.record_code,
      sampling_event_id: rec.sampling_event_id,
      species_id: rec.species_id,
      density_value: String(rec.density_value),
      density_unit: rec.density_unit,
      toxicity_status: rec.toxicity_status,
      morphological_notes: rec.morphological_notes || "",
    })
    setRecordFormError(null)
    setIsRecordDialogOpen(true)
  }

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRecordFormError(null)
    setRecordSubmitting(true)

    try {
      const payload = {
        record_code: recordFormData.record_code.trim(),
        sampling_event_id: recordFormData.sampling_event_id,
        species_id: recordFormData.species_id,
        density_value: parseFloat(recordFormData.density_value) || 0,
        density_unit: recordFormData.density_unit.trim(),
        toxicity_status: recordFormData.toxicity_status.trim(),
        morphological_notes: recordFormData.morphological_notes.trim(),
      }

      const url = isEditingRecord ? `/api/plankton/${editingRecordId}` : "/api/plankton"
      const method = isEditingRecord ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setRecordFormError(data.error || "Gagal menyimpan data rekaman")
        setRecordSubmitting(false)
        return
      }

      setIsRecordDialogOpen(false)
      showBanner(
        "success",
        isEditingRecord
          ? "Data pemantauan plankton / ubur-ubur berhasil diperbarui"
          : "Data pemantauan plankton / ubur-ubur baru berhasil ditambahkan"
      )
      fetchRecords()
    } catch (err) {
      console.error("Error submitting record:", err)
      setRecordFormError("Terjadi kesalahan jaringan saat menyimpan data")
    } finally {
      setRecordSubmitting(false)
    }
  }

  const handleDeleteRecordSubmit = async () => {
    if (!deletingRecord) return
    setDeleteRecordSubmitting(true)
    setDeleteRecordError(null)

    try {
      const res = await fetch(`/api/plankton/${deletingRecord.id}`, { method: "DELETE" })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setDeleteRecordError(data.error || "Gagal menghapus data")
        setDeleteRecordSubmitting(false)
        return
      }

      setIsDeleteRecordOpen(false)
      setDeletingRecord(null)
      showBanner("success", data.message || "Data berhasil dihapus")
      fetchRecords()
    } catch (err) {
      console.error("Error deleting record:", err)
      setDeleteRecordError("Terjadi kesalahan jaringan saat menghapus data")
    } finally {
      setDeleteRecordSubmitting(false)
    }
  }

  // Species Master Handlers
  const handleOpenAddSpecies = () => {
    setIsEditingSpecies(false)
    setEditingSpeciesId(null)
    setSpeciesFormData({
      ...initialSpeciesForm,
      species_code: `SP-${Date.now().toString().slice(-4)}`,
    })
    setSpeciesFormError(null)
    setIsSpeciesDialogOpen(true)
  }

  const handleOpenEditSpecies = (sp: SpeciesMaster) => {
    setIsEditingSpecies(true)
    setEditingSpeciesId(sp.id)
    setSpeciesFormData({
      species_code: sp.species_code,
      scientific_name: sp.scientific_name,
      common_name: sp.common_name || "",
      organism_category: sp.organism_category,
      is_toxic: sp.is_toxic,
      family: sp.family || "",
      genus: sp.genus || "",
      description: sp.description || "",
    })
    setSpeciesFormError(null)
    setIsSpeciesDialogOpen(true)
  }

  const handleSpeciesSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSpeciesFormError(null)
    setSpeciesSubmitting(true)

    try {
      const payload = {
        species_code: speciesFormData.species_code.trim(),
        scientific_name: speciesFormData.scientific_name.trim(),
        common_name: speciesFormData.common_name.trim() || null,
        organism_category: speciesFormData.organism_category,
        is_toxic: speciesFormData.is_toxic,
        family: speciesFormData.family.trim() || null,
        genus: speciesFormData.genus.trim() || null,
        description: speciesFormData.description.trim() || null,
      }

      const url = isEditingSpecies ? `/api/species/${editingSpeciesId}` : "/api/species"
      const method = isEditingSpecies ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setSpeciesFormError(data.error || "Gagal menyimpan data spesies")
        setSpeciesSubmitting(false)
        return
      }

      setIsSpeciesDialogOpen(false)
      showBanner(
        "success",
        isEditingSpecies
          ? `Data spesies '${payload.scientific_name}' berhasil diperbarui`
          : `Spesies '${payload.scientific_name}' berhasil ditambahkan ke katalog`
      )
      fetchSpecies()
      fetchOptions()
    } catch (err) {
      console.error("Error submitting species:", err)
      setSpeciesFormError("Terjadi kesalahan jaringan saat menyimpan data spesies")
    } finally {
      setSpeciesSubmitting(false)
    }
  }

  const handleDeleteSpeciesSubmit = async () => {
    if (!deletingSpecies) return
    setDeleteSpeciesSubmitting(true)
    setDeleteSpeciesError(null)

    try {
      const res = await fetch(`/api/species/${deletingSpecies.id}`, { method: "DELETE" })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setDeleteSpeciesError(data.error || "Gagal menghapus spesies")
        setDeleteSpeciesSubmitting(false)
        return
      }

      setIsDeleteSpeciesOpen(false)
      setDeletingSpecies(null)
      showBanner("success", data.message || "Spesies berhasil dihapus")
      fetchSpecies()
      fetchOptions()
    } catch (err) {
      console.error("Error deleting species:", err)
      setDeleteSpeciesError("Terjadi kesalahan jaringan saat menghapus spesies")
    } finally {
      setDeleteSpeciesSubmitting(false)
    }
  }

  // CSV Upload Handler
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

      const res = await fetch("/api/plankton/upload", {
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
      "record_code,sampling_code,scientific_name,density_value,density_unit,toxicity_status,morphological_notes\r\n" +
      "PLK-TMP-01,SMP-001,Pyrodinium bahamense,15000,sel/L,Beracun,Bentuk sel khas lempeng teka tebal\r\n" +
      "PLK-TMP-02,SMP-002,Chaetoceros sp.,8500,sel/L,Tidak Beracun,Membentuk rantai panjang diatom\r\n" +
      "JEL-TMP-03,SMP-003,Aurelia aurita,25,ind/m2,Iritasi Ringan,Dominasi medusa dewasa di permukaan"

    const blob = new Blob(["\uFEFF" + templateContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "template_plankton_jellyfish.csv")
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
        <span className="font-semibold text-foreground">Spesies (Plankton & Ubur-ubur)</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bug className="h-7 w-7 text-primary" />
            Spesies, Plankton & Ubur-ubur
          </h1>
          <p className="text-muted-foreground">
            Katalog master taksonomi serta rekaman kelimpahan fitoplankton, zooplankton, dan ledakan ubur-ubur per stasiun.
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <a
            href="/api/plankton/export"
            className={cn(buttonVariants({ variant: "outline" }))}
            target="_blank"
            rel="noopener noreferrer"
            title="Unduh seluruh data pemantauan sebagai CSV"
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
              {activeTab === "monitoring" ? (
                <Button onClick={handleOpenAddRecord} className="shadow-xs">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Rekaman
                </Button>
              ) : (
                <Button onClick={handleOpenAddSpecies} className="shadow-xs">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Spesies
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="space-y-4">
        <div className="flex items-center p-1 rounded-xl bg-muted/60 border w-full sm:w-[420px]">
          <button
            type="button"
            onClick={() => setActiveTab("monitoring")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer",
              activeTab === "monitoring"
                ? "bg-background text-foreground shadow-xs border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="h-4 w-4" />
            <span>Data Pemantauan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer",
              activeTab === "catalog"
                ? "bg-background text-foreground shadow-xs border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BookOpen className="h-4 w-4" />
            <span>Katalog Master Spesies</span>
          </button>
        </div>

        {/* TAB 1: DATA PEMANTAUAN (PLANKTON RECORDS) */}
        {activeTab === "monitoring" && (
          <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari kode rekord, nama spesies, stasiun, kode sampling..."
                value={recordSearch}
                onChange={(e) => setRecordSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || "all")}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Kategori">
                    {categoryFilter === "all" ? "Semua Kategori" : categoryFilter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="Fitoplankton">Fitoplankton</SelectItem>
                  <SelectItem value="Zooplankton">Zooplankton</SelectItem>
                  <SelectItem value="Ubur-ubur">Ubur-ubur</SelectItem>
                </SelectContent>
              </Select>

              <Select value={stationFilter} onValueChange={(val) => setStationFilter(val || "all")}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Pilih Stasiun">
                    {stationFilter === "all"
                      ? "Semua Stasiun"
                      : stationOptions.find((st) => st.id === stationFilter)
                      ? `${stationOptions.find((st) => st.id === stationFilter)?.station_code} - ${stationOptions.find((st) => st.id === stationFilter)?.name}`
                      : undefined}
                  </SelectValue>
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

              <Select value={toxicityFilter} onValueChange={(val) => setToxicityFilter(val || "all")}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Toksisitas">
                    {toxicityFilter === "all" ? "Semua Toksisitas" : toxicityFilter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Toksisitas</SelectItem>
                  <SelectItem value="Beracun">Beracun</SelectItem>
                  <SelectItem value="Tidak Beracun">Tidak Beracun</SelectItem>
                  <SelectItem value="Iritasi">Iritasi / Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table Records */}
          <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Kode Rekord</TableHead>
                  <TableHead>Sampling Event & Waktu</TableHead>
                  <TableHead>Stasiun</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Nama Spesies</TableHead>
                  <TableHead className="text-right">Kepadatan</TableHead>
                  <TableHead>Status Toksisitas</TableHead>
                  {authenticated && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordsLoading ? (
                  <TableRow>
                    <TableCell colSpan={authenticated ? 8 : 7} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span>Memuat data rekaman pemantauan plankton & ubur-ubur...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={authenticated ? 8 : 7} className="p-8">
                      <EmptyState
                        icon={Bug}
                        title="Tidak ada rekaman data"
                        description={
                          recordSearch || categoryFilter !== "all" || stationFilter !== "all" || toxicityFilter !== "all"
                            ? "Tidak ditemukan rekaman yang sesuai dengan kriteria filter pencarian."
                            : "Belum ada catatan kelimpahan fitoplankton, zooplankton, atau ubur-ubur."
                        }
                        actionLabel={authenticated ? "Tambah Rekaman Pertama" : undefined}
                        onAction={authenticated ? handleOpenAddRecord : undefined}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono font-bold text-primary">
                        <div className="flex items-center gap-1.5">
                          <Bug className="h-3.5 w-3.5 text-primary shrink-0" />
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
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-semibold",
                            r.organism_category === "Fitoplankton"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : r.organism_category === "Zooplankton"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                              : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                          )}
                        >
                          {r.organism_category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold italic text-foreground text-xs">
                            {r.scientific_name}
                          </span>
                          {r.common_name && (
                            <span className="text-[11px] text-muted-foreground">
                              {r.common_name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        <strong className="text-foreground">
                          {Number(r.density_value).toLocaleString("id-ID")}
                        </strong>{" "}
                        <span className="text-[11px] text-muted-foreground">{r.density_unit}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.toxicity_status.toLowerCase().includes("beracun") || r.is_toxic
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {r.toxicity_status}
                        </Badge>
                      </TableCell>
                      {authenticated && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditRecord(r)}
                              title="Edit Data"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setDeletingRecord(r)
                                setDeleteRecordError(null)
                                setIsDeleteRecordOpen(true)
                              }}
                              title="Hapus Data"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Hapus</span>
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          </div>
        )}

        {/* TAB 2: KATALOG MASTER SPESIES */}
        {activeTab === "catalog" && (
          <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari nama ilmiah, nama lokal, famili, genus..."
                value={speciesSearch}
                onChange={(e) => setSpeciesSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select
                value={speciesCategoryFilter}
                onValueChange={(val) => setSpeciesCategoryFilter(val || "all")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Kategori Spesies">
                    {speciesCategoryFilter === "all" ? "Semua Kategori" : speciesCategoryFilter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="Fitoplankton">Fitoplankton</SelectItem>
                  <SelectItem value="Zooplankton">Zooplankton</SelectItem>
                  <SelectItem value="Ubur-ubur">Ubur-ubur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Kode Spesies</TableHead>
                  <TableHead>Nama Ilmiah</TableHead>
                  <TableHead>Nama Lokal</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Taksonomi (Famili / Genus)</TableHead>
                  <TableHead>Status Toksisitas Master</TableHead>
                  <TableHead className="text-right">Total Rekaman</TableHead>
                  {authenticated && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {speciesLoading ? (
                  <TableRow>
                    <TableCell colSpan={authenticated ? 8 : 7} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span>Memuat katalog master spesies...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : speciesList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={authenticated ? 8 : 7} className="p-8">
                      <EmptyState
                        icon={BookOpen}
                        title="Tidak ada spesies ditemukan"
                        description="Belum ada spesies yang terdaftar dalam katalog master taksonomi."
                        actionLabel={authenticated ? "Tambah Spesies Baru" : undefined}
                        onAction={authenticated ? handleOpenAddSpecies : undefined}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  speciesList.map((sp) => (
                    <TableRow key={sp.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono font-bold text-primary">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{sp.species_code}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold italic text-foreground text-sm">
                          {sp.scientific_name}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {sp.common_name || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-semibold",
                            sp.organism_category === "Fitoplankton"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : sp.organism_category === "Zooplankton"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                              : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                          )}
                        >
                          {sp.organism_category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {sp.family || sp.genus ? (
                          <span className="text-foreground">
                            {sp.family ? `Fam. ${sp.family}` : ""}{sp.family && sp.genus ? " • " : ""}{sp.genus ? `Gen. ${sp.genus}` : ""}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={sp.is_toxic ? "destructive" : "secondary"}
                          className="text-[10px]"
                        >
                          {sp.is_toxic ? "Toksik / Berbahaya" : "Tidak Toksik"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        <span className="font-semibold text-foreground">{sp.records_count}</span> rekaman
                      </TableCell>
                      {authenticated && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditSpecies(sp)}
                              title="Edit Spesies"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setDeletingSpecies(sp)
                                setDeleteSpeciesError(null)
                                setIsDeleteSpeciesOpen(true)
                              }}
                              title="Hapus Spesies"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Hapus</span>
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          </div>
        )}
      </div>

      {/* MODAL DIALOG: ADD / EDIT REKAMAN PEMANTAUAN */}
      <Dialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <form onSubmit={handleRecordSubmit}>
            <DialogHeader>
              <DialogTitle>
                {isEditingRecord ? "Edit Data Pemantauan Plankton / Ubur-ubur" : "Tambah Data Pemantauan Plankton & Ubur-ubur"}
              </DialogTitle>
              <DialogDescription>
                Catat hasil identifikasi spesies dan nilai kepadatan dari sampling yang dipilih.
              </DialogDescription>
            </DialogHeader>

            {recordFormError && (
              <div className="p-3 my-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{recordFormError}</span>
              </div>
            )}

            <div className="grid gap-3.5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="record_code">Kode Rekord *</Label>
                  <Input
                    id="record_code"
                    placeholder="misal: PLK-101"
                    value={recordFormData.record_code}
                    onChange={(e) =>
                      setRecordFormData({ ...recordFormData, record_code: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sampling_event_id">Sampling Event *</Label>
                  <Select
                    value={recordFormData.sampling_event_id}
                    onValueChange={(val) =>
                      setRecordFormData({ ...recordFormData, sampling_event_id: val || "" })
                    }
                  >
                    <SelectTrigger id="sampling_event_id" className="w-full">
                      <SelectValue placeholder="Pilih Sampling Event">
                        {(() => {
                          const opt = samplingOptions.find((o) => o.id === recordFormData.sampling_event_id)
                          return opt ? `${opt.sampling_code} — ${opt.station_name} (${formatIndoDate(opt.sampling_date)})` : undefined
                        })()}
                      </SelectValue>
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

              <div className="space-y-1.5">
                <Label htmlFor="species_id">Pilih Spesies (Master Data) *</Label>
                <Select
                  value={recordFormData.species_id}
                  onValueChange={(val) => {
                    const sp = speciesOptions.find((s) => s.id === val)
                    setRecordFormData({
                      ...recordFormData,
                      species_id: val || "",
                      toxicity_status: sp?.is_toxic ? "Beracun" : "Tidak Beracun",
                    })
                  }}
                >
                  <SelectTrigger id="species_id" className="w-full">
                    <SelectValue placeholder="Pilih Spesies">
                      {(() => {
                        const sp = speciesOptions.find((s) => s.id === recordFormData.species_id)
                        return sp ? `${sp.scientific_name} (${sp.organism_category}${sp.common_name ? ` - ${sp.common_name}` : ""})` : undefined
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {speciesOptions.map((sp) => (
                      <SelectItem key={sp.id} value={sp.id}>
                        <span className="italic font-medium">{sp.scientific_name}</span>{" "}
                        <span className="text-muted-foreground">({sp.organism_category}{sp.common_name ? ` - ${sp.common_name}` : ""})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="density_value">Nilai Kepadatan / Kelimpahan *</Label>
                  <Input
                    id="density_value"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="misal: 15000"
                    value={recordFormData.density_value}
                    onChange={(e) =>
                      setRecordFormData({ ...recordFormData, density_value: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="density_unit">Satuan Kepadatan *</Label>
                  <Select
                    value={recordFormData.density_unit}
                    onValueChange={(val) =>
                      setRecordFormData({ ...recordFormData, density_unit: val || "sel/L" })
                    }
                  >
                    <SelectTrigger id="density_unit" className="w-full">
                      <SelectValue placeholder="Pilih Satuan">
                        {recordFormData.density_unit}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sel/L">sel/L (Fitoplankton)</SelectItem>
                      <SelectItem value="koloni/L">koloni/L</SelectItem>
                      <SelectItem value="ind/m³">ind/m³ (Zooplankton)</SelectItem>
                      <SelectItem value="ind/m²">ind/m² (Ubur-ubur)</SelectItem>
                      <SelectItem value="ind/100m²">ind/100m²</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="toxicity_status">Status Toksisitas Lapangan *</Label>
                <Select
                  value={recordFormData.toxicity_status}
                  onValueChange={(val) =>
                    setRecordFormData({ ...recordFormData, toxicity_status: val || "Tidak Beracun" })
                  }
                >
                  <SelectTrigger id="toxicity_status" className="w-full">
                    <SelectValue placeholder="Pilih Status Toksisitas">
                      {recordFormData.toxicity_status}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tidak Beracun">Tidak Beracun</SelectItem>
                    <SelectItem value="Beracun">Beracun (Toksik)</SelectItem>
                    <SelectItem value="Iritasi Ringan">Iritasi Ringan (Sengatan)</SelectItem>
                    <SelectItem value="Potensial Toksik">Potensial Toksik (Perlu Uji Lanjutan)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="morphological_notes">Catatan Morfologi / Mikroskopis</Label>
                <Input
                  id="morphological_notes"
                  placeholder="Karakteristik teka, rantai sel, diameter payung ubur-ubur, dll."
                  value={recordFormData.morphological_notes}
                  onChange={(e) =>
                    setRecordFormData({ ...recordFormData, morphological_notes: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRecordDialogOpen(false)}
                disabled={recordSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={recordSubmitting}>
                {recordSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditingRecord ? "Simpan Perubahan" : "Tambah Rekaman"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DIALOG: ADD / EDIT MASTER SPESIES */}
      <Dialog open={isSpeciesDialogOpen} onOpenChange={setIsSpeciesDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSpeciesSubmit}>
            <DialogHeader>
              <DialogTitle>
                {isEditingSpecies ? "Edit Data Master Spesies" : "Tambah Spesies Baru ke Katalog"}
              </DialogTitle>
              <DialogDescription>
                Daftarkan taksonomi spesies plankton atau ubur-ubur ke dalam master data JellyWatch.
              </DialogDescription>
            </DialogHeader>

            {speciesFormError && (
              <div className="p-3 my-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{speciesFormError}</span>
              </div>
            )}

            <div className="grid gap-3.5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sp_code">Kode Spesies *</Label>
                  <Input
                    id="sp_code"
                    placeholder="misal: SP-HAB-01"
                    value={speciesFormData.species_code}
                    onChange={(e) =>
                      setSpeciesFormData({ ...speciesFormData, species_code: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sp_category">Kategori Organisme *</Label>
                  <Select
                    value={speciesFormData.organism_category}
                    onValueChange={(val) =>
                      setSpeciesFormData({
                        ...speciesFormData,
                        organism_category: (val || "Fitoplankton") as "Fitoplankton" | "Zooplankton" | "Ubur-ubur",
                      })
                    }
                  >
                    <SelectTrigger id="sp_category" className="w-full">
                      <SelectValue placeholder="Pilih Kategori">
                        {speciesFormData.organism_category}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fitoplankton">Fitoplankton</SelectItem>
                      <SelectItem value="Zooplankton">Zooplankton</SelectItem>
                      <SelectItem value="Ubur-ubur">Ubur-ubur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sp_scientific">Nama Ilmiah (Binomial) *</Label>
                <Input
                  id="sp_scientific"
                  placeholder="misal: Pyrodinium bahamense"
                  value={speciesFormData.scientific_name}
                  onChange={(e) =>
                    setSpeciesFormData({ ...speciesFormData, scientific_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sp_common">Nama Lokal / Umum</Label>
                <Input
                  id="sp_common"
                  placeholder="misal: Alga Berpendar / Ubur-ubur Api"
                  value={speciesFormData.common_name}
                  onChange={(e) =>
                    setSpeciesFormData({ ...speciesFormData, common_name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sp_family">Famili</Label>
                  <Input
                    id="sp_family"
                    placeholder="misal: Goniodomataceae"
                    value={speciesFormData.family}
                    onChange={(e) =>
                      setSpeciesFormData({ ...speciesFormData, family: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sp_genus">Genus</Label>
                  <Input
                    id="sp_genus"
                    placeholder="misal: Pyrodinium"
                    value={speciesFormData.genus}
                    onChange={(e) =>
                      setSpeciesFormData({ ...speciesFormData, genus: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sp_desc">Deskripsi & Catatan Toksisitas</Label>
                <Input
                  id="sp_desc"
                  placeholder="Penghasil racun Saxitoxin (PSP), pemicu bioluminescence..."
                  value={speciesFormData.description}
                  onChange={(e) =>
                    setSpeciesFormData({ ...speciesFormData, description: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sp_toxic"
                  checked={speciesFormData.is_toxic}
                  onChange={(e) =>
                    setSpeciesFormData({ ...speciesFormData, is_toxic: e.target.checked })
                  }
                  className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                />
                <Label htmlFor="sp_toxic" className="text-xs font-semibold cursor-pointer">
                  Spesies ini bersifat Toksik / Penyebab HABs / Sengatan Berbahaya
                </Label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSpeciesDialogOpen(false)}
                disabled={speciesSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={speciesSubmitting}>
                {speciesSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditingSpecies ? "Simpan Perubahan" : "Tambah Spesies"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DIALOG: BULK CSV UPLOAD */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleUploadSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Unggah Dataset CSV Plankton & Ubur-ubur
              </DialogTitle>
              <DialogDescription>
                Unggah berkas CSV untuk mengimpor atau memperbarui data rekaman pemantauan secara massal.
              </DialogDescription>
            </DialogHeader>

            <div className="p-3 my-2 text-xs rounded-lg bg-primary/10 border border-primary/20 text-foreground flex items-start gap-2">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-primary">Format Kolom CSV yang Didukung:</p>
                <p className="mt-0.5 text-muted-foreground">
                  <code className="text-[11px] font-mono font-bold">record_code, sampling_code, scientific_name, density_value, density_unit, toxicity_status, morphological_notes</code>
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

      {/* CONFIRMATION DIALOG: DELETE RECORD */}
      <Dialog open={isDeleteRecordOpen} onOpenChange={setIsDeleteRecordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Konfirmasi Hapus Data Pemantauan
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data rekaman{" "}
              <strong className="text-foreground">{deletingRecord?.record_code}</strong> (Spesies: <em>{deletingRecord?.scientific_name}</em>, Sampling: {deletingRecord?.sampling_code})?
            </DialogDescription>
          </DialogHeader>

          {deleteRecordError && (
            <div className="p-3 my-2 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{deleteRecordError}</span>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteRecordOpen(false)}
              disabled={deleteRecordSubmitting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRecordSubmit}
              disabled={deleteRecordSubmitting}
            >
              {deleteRecordSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION DIALOG: DELETE SPECIES MASTER */}
      <Dialog open={isDeleteSpeciesOpen} onOpenChange={setIsDeleteSpeciesOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Konfirmasi Hapus Spesies Master
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus spesies{" "}
              <strong className="text-foreground italic">{deletingSpecies?.scientific_name}</strong> ({deletingSpecies?.species_code}) dari katalog master?
            </DialogDescription>
          </DialogHeader>

          {deleteSpeciesError && (
            <div className="p-3 my-2 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{deleteSpeciesError}</span>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteSpeciesOpen(false)}
              disabled={deleteSpeciesSubmitting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSpeciesSubmit}
              disabled={deleteSpeciesSubmitting}
            >
              {deleteSpeciesSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus Spesies
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
