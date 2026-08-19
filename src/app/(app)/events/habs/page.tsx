"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
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
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle,
  Plus,
  Search,
  Download,
  Calendar,
  MapPin,
  Droplets,
  Bug,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Edit,
  ExternalLink,
  Layers,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface WaterQualityRecord {
  id: string
  record_code: string
  temperature_c?: string | number
  salinity_psu?: string | number
  dissolved_oxygen_mgl?: string | number
  ph?: string | number
  chlorophyll_a_ugl?: string | number
  notes?: string
}

interface PlanktonRecord {
  id: string
  record_code: string
  species_name: string
  organism_category?: string
  density_value?: string | number
  density_unit?: string
  toxicity_status?: string
  notes?: string
}

interface BloomEvent {
  id: string
  event_code: string
  station_id: string
  station_name: string
  station_code?: string
  city?: string
  province?: string
  latitude?: string | number
  longitude?: string | number
  event_start_date: string
  event_end_date: string | null
  event_type: "Harmful Algal Blooms" | "Jellyfish Bloom"
  severity_level: "rendah" | "sedang" | "tinggi" | "kritis"
  alert_status: "Normal" | "Waspada" | "Siaga" | "Darurat"
  description: string
  impact_assessment: string
  response_action: string
  reporter_name?: string
  validator_name?: string
  validated_at?: string | null
  created_at?: string
  water_quality_records: WaterQualityRecord[]
  plankton_records: PlanktonRecord[]
}

interface OptionStation {
  id: string
  station_code: string
  name: string
  city: string
  province: string
}

interface OptionWaterQuality {
  id: string
  record_code: string
  temperature_c: string | number
  chlorophyll_a_ugl: string | number
  dissolved_oxygen_mgl: string | number
  station_name: string
  sampling_code: string
  sampling_date: string
}

interface OptionPlankton {
  id: string
  record_code: string
  scientific_name: string
  organism_category: string
  density_value: string | number
  density_unit: string
  toxicity_status: string
  station_name: string
  sampling_code: string
  sampling_date: string
}

export default function EventsPage() {
  const { authenticated } = useAuth()

  const [events, setEvents] = React.useState<BloomEvent[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  // Options for modal form
  const [stations, setStations] = React.useState<OptionStation[]>([])
  const [wqOptions, setWqOptions] = React.useState<OptionWaterQuality[]>([])
  const [planktonOptions, setPlanktonOptions] = React.useState<OptionPlankton[]>([])

  // Modal States
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [selectedEvent, setSelectedEvent] = React.useState<BloomEvent | null>(null)

  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState("")

  // Form Field States
  const [formData, setFormData] = React.useState({
    event_code: "",
    station_id: "",
    event_start_date: "",
    event_end_date: "",
    is_ongoing: false,
    event_type: "Harmful Algal Blooms" as "Harmful Algal Blooms" | "Jellyfish Bloom",
    severity_level: "sedang" as "rendah" | "sedang" | "tinggi" | "kritis",
    alert_status: "Waspada" as "Normal" | "Waspada" | "Siaga" | "Darurat",
    description: "",
    impact_assessment: "",
    response_action: "",
    water_quality_ids: [] as string[],
    plankton_ids: [] as string[],
  })

  // Fetch Events from API
  const fetchEvents = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/events")
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setEvents(json.data)
      }
    } catch (err) {
      console.error("Failed to load events:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch Options for Form
  const fetchOptions = React.useCallback(async () => {
    try {
      const res = await fetch("/api/events/options")
      const json = await res.json()
      if (json.success && json.data) {
        setStations(json.data.stations || [])
        setWqOptions(json.data.water_quality || [])
        setPlanktonOptions(json.data.plankton || [])
      }
    } catch (err) {
      console.error("Failed to load form options:", err)
    }
  }, [])

  React.useEffect(() => {
    fetchEvents()
    fetchOptions()
  }, [fetchEvents, fetchOptions])

  // Open Create Modal
  const handleOpenCreate = () => {
    setIsEditing(false)
    setEditingId(null)
    setFormError("")
    const today = new Date().toISOString().split("T")[0]
    const randomSuffix = Math.floor(100 + Math.random() * 900)
    setFormData({
      event_code: `EVT-${today.replace(/-/g, "").slice(0, 6)}-${randomSuffix}`,
      station_id: stations[0]?.id || "",
      event_start_date: today,
      event_end_date: "",
      is_ongoing: true,
      event_type: "Harmful Algal Blooms",
      severity_level: "sedang",
      alert_status: "Waspada",
      description: "",
      impact_assessment: "",
      response_action: "",
      water_quality_ids: [],
      plankton_ids: [],
    })
    setIsFormOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (evt: BloomEvent) => {
    setIsEditing(true)
    setEditingId(evt.id)
    setFormError("")
    setFormData({
      event_code: evt.event_code,
      station_id: evt.station_id,
      event_start_date: evt.event_start_date,
      event_end_date: evt.event_end_date || "",
      is_ongoing: !evt.event_end_date,
      event_type: evt.event_type,
      severity_level: evt.severity_level,
      alert_status: evt.alert_status,
      description: evt.description || "",
      impact_assessment: evt.impact_assessment || "",
      response_action: evt.response_action || "",
      water_quality_ids: evt.water_quality_records.map((w) => w.id),
      plankton_ids: evt.plankton_records.map((p) => p.id),
    })
    setIsFormOpen(true)
  }

  // Handle Form Submit (Create / Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    setSubmitting(true)

    try {
      if (!formData.station_id) {
        setFormError("Pilih stasiun monitoring")
        setSubmitting(false)
        return
      }

      if (!formData.event_start_date) {
        setFormError("Tanggal mulai kejadian harus diisi")
        setSubmitting(false)
        return
      }

      const payload = {
        event_code: formData.event_code,
        station_id: formData.station_id,
        event_start_date: formData.event_start_date,
        event_end_date: formData.is_ongoing ? null : formData.event_end_date || null,
        event_type: formData.event_type,
        severity_level: formData.severity_level,
        alert_status: formData.alert_status,
        description: formData.description,
        impact_assessment: formData.impact_assessment,
        response_action: formData.response_action,
        water_quality_ids: formData.water_quality_ids,
        plankton_ids: formData.plankton_ids,
      }

      const url = isEditing && editingId ? `/api/events/${editingId}` : "/api/events"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        setFormError(json.error || "Gagal menyimpan kejadian")
        setSubmitting(false)
        return
      }

      setIsFormOpen(false)
      await fetchEvents()
    } catch (err) {
      console.error("Submit event error:", err)
      setFormError("Terjadi kesalahan jaringan")
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Delete Event
  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus kejadian ${code}?`)) {
      return
    }

    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (json.success) {
        if (selectedEvent?.id === id) {
          setIsDetailOpen(false)
        }
        await fetchEvents()
      } else {
        alert(json.error || "Gagal menghapus kejadian")
      }
    } catch (err) {
      console.error("Delete event error:", err)
      alert("Terjadi kesalahan jaringan")
    }
  }

  // Toggle Selection Helper
  const toggleWqSelection = (id: string) => {
    setFormData((prev) => {
      const exists = prev.water_quality_ids.includes(id)
      return {
        ...prev,
        water_quality_ids: exists
          ? prev.water_quality_ids.filter((item) => item !== id)
          : [...prev.water_quality_ids, id],
      }
    })
  }

  const togglePlanktonSelection = (id: string) => {
    setFormData((prev) => {
      const exists = prev.plankton_ids.includes(id)
      return {
        ...prev,
        plankton_ids: exists
          ? prev.plankton_ids.filter((item) => item !== id)
          : [...prev.plankton_ids, id],
      }
    })
  }

  // Filtered Events
  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.event_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.station_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === "all" || evt.event_type === typeFilter
    const matchesStatus = statusFilter === "all" || evt.alert_status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  // Format Date Range Helper
  const formatDateRange = (start: string, end: string | null) => {
    if (!start) return "-"
    const startDateObj = new Date(start)
    const startStr = startDateObj.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

    if (!end) {
      return (
        <div className="flex items-center gap-1.5 text-xs">
          <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-semibold">{startStr}</span>
          <span className="text-muted-foreground">–</span>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0 h-4">
            Berlangsung
          </Badge>
        </div>
      )
    }

    const endDateObj = new Date(end)
    const endStr = endDateObj.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

    return (
      <div className="flex items-center gap-1.5 text-xs">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span>{startStr}</span>
        <span className="text-muted-foreground">–</span>
        <span>{endStr}</span>
      </div>
    )
  }

  // Export CSV
  const handleExportCSV = () => {
    if (filteredEvents.length === 0) return

    const headers = [
      "Kode Kejadian",
      "Stasiun",
      "Tanggal Mulai",
      "Tanggal Selesai",
      "Jenis Kejadian",
      "Tingkat Keparahan",
      "Status Peringatan",
      "Jumlah Data Kualitas Air",
      "Jumlah Data Plankton",
      "Deskripsi",
    ]

    const rows = filteredEvents.map((e) => [
      `"${e.event_code}"`,
      `"${e.station_name}"`,
      `"${e.event_start_date}"`,
      `"${e.event_end_date || "Berlangsung"}"`,
      `"${e.event_type}"`,
      `"${e.severity_level}"`,
      `"${e.alert_status}"`,
      `"${e.water_quality_records.length}"`,
      `"${e.plankton_records.length}"`,
      `"${(e.description || "").replace(/"/g, '""')}"`,
    ])

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `kejadian_blooming_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kejadian (Events)</h1>
          <p className="text-muted-foreground">
            Dokumentasi peringatan kejadian Harmful Algal Blooms (HABs) dan blooming ubur-ubur berbahaya berdasarkan rentang waktu dan parameter kualitas air laut.
          </p>
        </div>
        {authenticated && (
          <Button onClick={handleOpenCreate} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Catat Kejadian
          </Button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari kode kejadian, stasiun, deskripsi..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Jenis Kejadian */}
          <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val || "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Jenis Kejadian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jenis</SelectItem>
              <SelectItem value="Harmful Algal Blooms">Harmful Algal Blooms</SelectItem>
              <SelectItem value="Jellyfish Bloom">Jellyfish Bloom</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Status Peringatan */}
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status Alert" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="Waspada">Waspada</SelectItem>
              <SelectItem value="Siaga">Siaga</SelectItem>
              <SelectItem value="Darurat">Darurat</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExportCSV} disabled={filteredEvents.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Ekspor CSV
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-md border bg-card shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Memuat data kejadian blooming...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Belum ada laporan kejadian"
            description="Tidak ada catatan kejadian HABs atau blooming ubur-ubur yang sesuai dengan filter."
            actionLabel={authenticated ? "Catat Kejadian" : undefined}
            onAction={handleOpenCreate}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Kejadian</TableHead>
                <TableHead>Rentang Waktu</TableHead>
                <TableHead>Lokasi / Stasiun</TableHead>
                <TableHead>Jenis Kejadian</TableHead>
                <TableHead>Data Kualitas Air Terkait</TableHead>
                <TableHead>Status Peringatan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((e) => (
                <TableRow key={e.id} className="hover:bg-muted/40 transition-colors">
                  {/* Kode Kejadian */}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-full ${
                          e.alert_status === "Darurat" || e.alert_status === "Siaga"
                            ? "bg-destructive/15 text-destructive"
                            : e.alert_status === "Waspada"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-primary/15 text-primary"
                        }`}
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">{e.event_code}</span>
                        <div className="text-[11px] text-muted-foreground capitalize">
                          Tingkat: {e.severity_level}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Rentang Waktu */}
                  <TableCell>
                    {formatDateRange(e.event_start_date, e.event_end_date)}
                  </TableCell>

                  {/* Lokasi / Stasiun */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium text-sm">{e.station_name}</span>
                    </div>
                    {e.city && (
                      <div className="text-xs text-muted-foreground pl-5">
                        {e.city}, {e.province}
                      </div>
                    )}
                  </TableCell>

                  {/* Jenis Kejadian */}
                  <TableCell>
                    <Badge
                      variant={e.event_type === "Harmful Algal Blooms" ? "destructive" : "secondary"}
                      className="font-normal text-xs"
                    >
                      {e.event_type === "Harmful Algal Blooms" ? "HABs" : "Jellyfish"}
                    </Badge>
                  </TableCell>

                  {/* Data Kualitas Air Terkait */}
                  <TableCell>
                    {e.water_quality_records && e.water_quality_records.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                          <Droplets className="h-3.5 w-3.5" />
                          <span>{e.water_quality_records.length} Record Terhubung</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Chl-a: {e.water_quality_records[0].chlorophyll_a_ugl || "-"} µg/L | Suhu: {e.water_quality_records[0].temperature_c || "-"}°C
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Tidak ada relasi WQ</span>
                    )}
                  </TableCell>

                  {/* Status Peringatan */}
                  <TableCell>
                    <Badge
                      variant={
                        e.alert_status === "Darurat" || e.alert_status === "Siaga"
                          ? "destructive"
                          : e.alert_status === "Waspada"
                          ? "default"
                          : "secondary"
                      }
                      className={
                        e.alert_status === "Waspada"
                          ? "bg-amber-600 hover:bg-amber-700 text-white"
                          : undefined
                      }
                    >
                      {e.alert_status}
                    </Badge>
                  </TableCell>

                  {/* Action Buttons */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedEvent(e)
                          setIsDetailOpen(true)
                        }}
                      >
                        <Info className="h-4 w-4 mr-1 text-primary" />
                        Detail
                      </Button>

                      {authenticated && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(e)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(e.id, e.event_code)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* DETAIL MODAL DIALOG */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-destructive/15 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold">{selectedEvent.event_code}</DialogTitle>
                      <DialogDescription>
                        {selectedEvent.event_type} • Stasiun {selectedEvent.station_name}
                      </DialogDescription>
                    </div>
                  </div>
                  <Badge
                    variant={
                      selectedEvent.alert_status === "Darurat" || selectedEvent.alert_status === "Siaga"
                        ? "destructive"
                        : "default"
                    }
                    className="text-sm px-3 py-1"
                  >
                    Status: {selectedEvent.alert_status}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Informasi Rentang Waktu & Lokasi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50 border">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Rentang Waktu Kejadian
                    </div>
                    <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{selectedEvent.event_start_date}</span>
                      <span>s/d</span>
                      <span>
                        {selectedEvent.event_end_date ? (
                          selectedEvent.event_end_date
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
                            Sedang Berlangsung
                          </Badge>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Lokasi Stasiun
                    </div>
                    <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{selectedEvent.station_name}</span>
                    </div>
                    {selectedEvent.city && (
                      <div className="text-xs text-muted-foreground">
                        {selectedEvent.city}, {selectedEvent.province}
                      </div>
                    )}
                  </div>
                </div>

                {/* Deskripsi Kronologi & Dampak */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Kronologi & Deskripsi</h4>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {selectedEvent.description || "Tidak ada deskripsi rinci."}
                    </p>
                  </div>

                  {selectedEvent.impact_assessment && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Dampak Lingkungan & Sosial</h4>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {selectedEvent.impact_assessment}
                      </p>
                    </div>
                  )}

                  {selectedEvent.response_action && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Tindakan Respon & Mitigasi</h4>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {selectedEvent.response_action}
                      </p>
                    </div>
                  )}
                </div>

                {/* RELASI PARAMETER KUALITAS AIR */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-primary" />
                      <h4 className="text-sm font-bold text-foreground">
                        Parameter Kualitas Air Terkait (Environmental Triggers)
                      </h4>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {selectedEvent.water_quality_records.length} Data
                    </Badge>
                  </div>

                  {selectedEvent.water_quality_records.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic p-3 bg-muted/30 rounded-md">
                      Belum ada data kualitas air yang dihubungkan dengan kejadian ini.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                      {selectedEvent.water_quality_records.map((wq) => (
                        <div key={wq.id} className="p-3 rounded-lg border bg-card text-xs space-y-2">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-primary">{wq.record_code}</span>
                            {wq.notes && <span className="text-muted-foreground text-[11px] italic">{wq.notes}</span>}
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center pt-1 border-t">
                            <div className="p-1.5 rounded bg-muted/50">
                              <span className="text-muted-foreground block text-[10px]">Suhu</span>
                              <span className="font-bold">{wq.temperature_c ?? "-"} °C</span>
                            </div>
                            <div className="p-1.5 rounded bg-muted/50">
                              <span className="text-muted-foreground block text-[10px]">Salinitas</span>
                              <span className="font-bold">{wq.salinity_psu ?? "-"} psu</span>
                            </div>
                            <div className="p-1.5 rounded bg-muted/50">
                              <span className="text-muted-foreground block text-[10px]">DO</span>
                              <span className="font-bold">{wq.dissolved_oxygen_mgl ?? "-"} mg/L</span>
                            </div>
                            <div className="p-1.5 rounded bg-muted/50">
                              <span className="text-muted-foreground block text-[10px]">pH</span>
                              <span className="font-bold">{wq.ph ?? "-"}</span>
                            </div>
                            <div className="p-1.5 rounded bg-muted/50 border border-primary/20">
                              <span className="text-primary font-medium block text-[10px]">Klorofil-a</span>
                              <span className="font-bold text-primary">{wq.chlorophyll_a_ugl ?? "-"} µg/L</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* RELASI PLANKTON / UBUR-UBUR */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bug className="h-5 w-5 text-primary" />
                      <h4 className="text-sm font-bold text-foreground">
                        Spesies Plankton & Ubur-ubur Terkait
                      </h4>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {selectedEvent.plankton_records.length} Spesies
                    </Badge>
                  </div>

                  {selectedEvent.plankton_records.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic p-3 bg-muted/30 rounded-md">
                      Belum ada data spesies plankton/ubur-ubur yang dihubungkan.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {selectedEvent.plankton_records.map((p) => (
                        <div key={p.id} className="p-2.5 rounded-lg border bg-card flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold italic text-foreground">{p.species_name}</span>
                            <div className="text-[11px] text-muted-foreground">
                              {p.organism_category || "Plankton"} • Kepadatan: {p.density_value} {p.density_unit}
                            </div>
                          </div>
                          <Badge variant={p.toxicity_status === "Beracun" ? "destructive" : "secondary"}>
                            {p.toxicity_status || "Tidak Beracun"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pelapor & Validator */}
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                  <div>
                    Pelapor: <span className="font-semibold text-foreground">{selectedEvent.reporter_name || "Admin"}</span>
                  </div>
                  {selectedEvent.validator_name && (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Divalidasi oleh {selectedEvent.validator_name}</span>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Tutup
                </Button>
                {authenticated && (
                  <Button
                    onClick={() => {
                      setIsDetailOpen(false)
                      handleOpenEdit(selectedEvent)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Kejadian
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* CREATE / EDIT EVENT FORM MODAL */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {isEditing ? "Edit Catatan Kejadian" : "Catat Kejadian Blooming Baru"}
            </DialogTitle>
            <DialogDescription>
              Catat kejadian HABs atau ledakan ubur-ubur lengkap dengan rentang waktu kejadian dan keterkaitan data kualitas air.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {formError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Kode Kejadian */}
              <div className="space-y-1.5">
                <Label htmlFor="event_code">Kode Kejadian *</Label>
                <Input
                  id="event_code"
                  required
                  value={formData.event_code}
                  onChange={(e) => setFormData({ ...formData, event_code: e.target.value })}
                  placeholder="Contoh: EVT-202607-01"
                  disabled={isEditing}
                />
              </div>

              {/* Stasiun Monitoring */}
              <div className="space-y-1.5">
                <Label htmlFor="station_id">Stasiun Monitoring *</Label>
                <Select
                  value={formData.station_id}
                  onValueChange={(val) => val && setFormData((prev) => ({ ...prev, station_id: val }))}
                >
                  <SelectTrigger id="station_id">
                    <SelectValue placeholder="Pilih Stasiun" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((st) => (
                      <SelectItem key={st.id} value={st.id}>
                        {st.name} ({st.station_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rentang Waktu: Mulai & Selesai */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-lg border bg-muted/30">
              <div className="space-y-1.5">
                <Label htmlFor="event_start_date">Tanggal Mulai Kejadian *</Label>
                <Input
                  id="event_start_date"
                  type="date"
                  required
                  value={formData.event_start_date}
                  onChange={(e) => setFormData({ ...formData, event_start_date: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="event_end_date">Tanggal Selesai</Label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_ongoing}
                      onChange={(e) => setFormData({ ...formData, is_ongoing: e.target.checked })}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                    />
                    Masih berlangsung
                  </label>
                </div>
                <Input
                  id="event_end_date"
                  type="date"
                  disabled={formData.is_ongoing}
                  value={formData.is_ongoing ? "" : formData.event_end_date}
                  onChange={(e) => setFormData({ ...formData, event_end_date: e.target.value })}
                  placeholder="Kosongkan jika masih berlangsung"
                />
              </div>
            </div>

            {/* Jenis Kejadian & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="event_type">Jenis Kejadian</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(val) =>
                    val &&
                    setFormData((prev) => ({
                      ...prev,
                      event_type: val as "Harmful Algal Blooms" | "Jellyfish Bloom",
                    }))
                  }
                >
                  <SelectTrigger id="event_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Harmful Algal Blooms">Harmful Algal Blooms (HABs)</SelectItem>
                    <SelectItem value="Jellyfish Bloom">Jellyfish Bloom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="severity_level">Tingkat Keparahan</Label>
                <Select
                  value={formData.severity_level}
                  onValueChange={(val) =>
                    val &&
                    setFormData((prev) => ({
                      ...prev,
                      severity_level: val as "rendah" | "sedang" | "tinggi" | "kritis",
                    }))
                  }
                >
                  <SelectTrigger id="severity_level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rendah">Rendah</SelectItem>
                    <SelectItem value="sedang">Sedang</SelectItem>
                    <SelectItem value="tinggi">Tinggi</SelectItem>
                    <SelectItem value="kritis">Kritis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="alert_status">Status Peringatan</Label>
                <Select
                  value={formData.alert_status}
                  onValueChange={(val) =>
                    val &&
                    setFormData((prev) => ({
                      ...prev,
                      alert_status: val as "Normal" | "Waspada" | "Siaga" | "Darurat",
                    }))
                  }
                >
                  <SelectTrigger id="alert_status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Waspada">Waspada</SelectItem>
                    <SelectItem value="Siaga">Siaga</SelectItem>
                    <SelectItem value="Darurat">Darurat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* KAITKAN DATA KUALITAS AIR */}
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 font-bold text-foreground">
                  <Droplets className="h-4 w-4 text-primary" />
                  Kaitkan Data Kualitas Air (Water Quality Triggers)
                </Label>
                <span className="text-xs text-muted-foreground">
                  {formData.water_quality_ids.length} dipilih
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Pilih record kualitas air di stasiun terkait yang memicu atau mencatat kondisi perairan saat kejadian:
              </p>

              <div className="max-h-36 overflow-y-auto space-y-1.5 border rounded-md p-2 bg-card">
                {wqOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-2">
                    Belum ada data kualitas air di database.
                  </p>
                ) : (
                  wqOptions.map((wq) => {
                    const isChecked = formData.water_quality_ids.includes(wq.id)
                    return (
                      <label
                        key={wq.id}
                        className={`flex items-center justify-between p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                          isChecked ? "bg-primary/10 border-primary/40 font-medium" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleWqSelection(wq.id)}
                            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                          />
                          <div>
                            <span className="font-semibold text-foreground">{wq.record_code}</span>
                            <span className="text-muted-foreground ml-2">({wq.station_name})</span>
                          </div>
                        </div>
                        <div className="text-muted-foreground">
                          Chl-a: <strong className="text-primary">{wq.chlorophyll_a_ugl} µg/L</strong> | Suhu: {wq.temperature_c}°C | DO: {wq.dissolved_oxygen_mgl} mg/L
                        </div>
                      </label>
                    )
                  })
                )}
              </div>
            </div>

            {/* KAITKAN DATA PLANKTON / UBUR-UBUR */}
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 font-bold text-foreground">
                  <Bug className="h-4 w-4 text-primary" />
                  Kaitkan Data Spesies Plankton / Ubur-ubur
                </Label>
                <span className="text-xs text-muted-foreground">
                  {formData.plankton_ids.length} dipilih
                </span>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1.5 border rounded-md p-2 bg-card">
                {planktonOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-2">
                    Belum ada data plankton di database.
                  </p>
                ) : (
                  planktonOptions.map((p) => {
                    const isChecked = formData.plankton_ids.includes(p.id)
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center justify-between p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                          isChecked ? "bg-primary/10 border-primary/40 font-medium" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePlanktonSelection(p.id)}
                            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                          />
                          <div>
                            <span className="font-semibold italic text-foreground">{p.scientific_name}</span>
                            <span className="text-muted-foreground ml-2">({p.record_code})</span>
                          </div>
                        </div>
                        <Badge variant={p.toxicity_status === "Beracun" ? "destructive" : "outline"} className="text-[10px]">
                          {p.toxicity_status}
                        </Badge>
                      </label>
                    )
                  })
                )}
              </div>
            </div>

            {/* Deskripsi, Dampak, Respon */}
            <div className="space-y-3 border-t pt-3">
              <div className="space-y-1.5">
                <Label htmlFor="description">Kronologi & Deskripsi Kejadian</Label>
                <textarea
                  id="description"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Catatan kronologi kejadian, perubahan warna air laut, luas area, dll."
                  className="w-full text-xs p-2 rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="impact_assessment">Dampak Lingkungan & Masyarakat</Label>
                <textarea
                  id="impact_assessment"
                  rows={2}
                  value={formData.impact_assessment}
                  onChange={(e) => setFormData({ ...formData, impact_assessment: e.target.value })}
                  placeholder="Potensi keracunan kerang, gangguan pariwisata, kematian ikan, dll."
                  className="w-full text-xs p-2 rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="response_action">Tindakan Respon & Mitigasi</Label>
                <textarea
                  id="response_action"
                  rows={2}
                  value={formData.response_action}
                  onChange={(e) => setFormData({ ...formData, response_action: e.target.value })}
                  placeholder="Himbauan publik, penutupan pantai sementara, pengambilan sampel lanjutan."
                  className="w-full text-xs p-2 rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : isEditing ? (
                  "Perbarui Kejadian"
                ) : (
                  "Simpan Kejadian"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
