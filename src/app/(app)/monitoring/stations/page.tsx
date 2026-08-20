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
  Bug,
  Anchor,
  Edit,
  Trash2,
  Loader2,
  Calendar,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

interface Station {
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
  sampling_count: number
  water_quality_count: number
  plankton_count: number
  bloom_events_count: number
}

const initialFormData = {
  station_code: "",
  name: "",
  province: "",
  city: "",
  latitude: "",
  longitude: "",
  description: "",
  status: "aktif" as "aktif" | "nonaktif",
}

export default function StationsPage() {
  const { authenticated } = useAuth()

  const [stations, setStations] = React.useState<Station[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  // Form & Dialog states
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState(initialFormData)
  const [formSubmitting, setFormSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  // Delete dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [deletingStation, setDeletingStation] = React.useState<Station | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  // Notification banner
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

  const fetchStations = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.append("q", searchQuery.trim())
      if (statusFilter !== "all") params.append("status", statusFilter)

      const res = await fetch(`/api/stations?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setStations(data.data)
      } else {
        showBanner("error", data.error || "Gagal memuat stasiun")
      }
    } catch (err) {
      console.error("Error fetching stations:", err)
      showBanner("error", "Terjadi kesalahan jaringan saat memuat stasiun")
    } finally {
      setLoading(false)
    }
  }, [searchQuery, statusFilter])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchStations()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchStations])

  const handleOpenAddDialog = () => {
    setIsEditing(false)
    setEditingId(null)
    setFormData(initialFormData)
    setFormError(null)
    setIsDialogOpen(true)
  }

  const handleOpenEditDialog = (station: Station) => {
    setIsEditing(true)
    setEditingId(station.id)
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
    setIsDialogOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const lat = parseFloat(formData.latitude)
    const lng = parseFloat(formData.longitude)

    if (isNaN(lat) || isNaN(lng)) {
      setFormError("Latitude dan Longitude harus berupa angka valid")
      return
    }

    setFormSubmitting(true)

    try {
      const payload = {
        station_code: formData.station_code.trim(),
        name: formData.name.trim(),
        province: formData.province.trim(),
        city: formData.city.trim(),
        latitude: lat,
        longitude: lng,
        description: formData.description.trim(),
        status: formData.status,
      }

      const url = isEditing ? `/api/stations/${editingId}` : "/api/stations"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setFormError(data.error || "Gagal menyimpan data stasiun")
        setFormSubmitting(false)
        return
      }

      setIsDialogOpen(false)
      showBanner(
        "success",
        isEditing
          ? "Stasiun monitoring berhasil diperbarui"
          : "Stasiun monitoring baru berhasil ditambahkan"
      )
      fetchStations()
    } catch (err) {
      console.error("Error submitting station form:", err)
      setFormError("Terjadi kesalahan jaringan saat menyimpan stasiun")
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleOpenDeleteDialog = (station: Station) => {
    setDeletingStation(station)
    setDeleteError(null)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteSubmit = async () => {
    if (!deletingStation) return
    setDeleteSubmitting(true)
    setDeleteError(null)

    try {
      const res = await fetch(`/api/stations/${deletingStation.id}`, {
        method: "DELETE",
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setDeleteError(data.error || "Gagal menghapus stasiun")
        setDeleteSubmitting(false)
        return
      }

      setIsDeleteDialogOpen(false)
      setDeletingStation(null)
      showBanner("success", data.message || "Stasiun berhasil dihapus")
      fetchStations()
    } catch (err) {
      console.error("Error deleting station:", err)
      setDeleteError("Terjadi kesalahan jaringan saat menghapus stasiun")
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Anchor className="h-7 w-7 text-primary" />
            Stasiun Monitoring
          </h1>
          <p className="text-muted-foreground">
            Daftar stasiun lokasi pemantauan kualitas air, plankton, dan kejadian blooming pesisir.
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <Link
            href="/monitoring/stations/water-quality"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Droplets className="mr-2 h-4 w-4 text-primary" />
            Data Kualitas Air
          </Link>
          <Link
            href="/monitoring/stations/plankton"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Bug className="mr-2 h-4 w-4 text-accent-violet" />
            Data Plankton
          </Link>

          {authenticated && (
            <Button onClick={handleOpenAddDialog} className="shadow-xs">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Stasiun
            </Button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari berdasarkan kode, nama stasiun, provinsi, kab/kota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="nonaktif">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Kode</TableHead>
              <TableHead>Nama Stasiun</TableHead>
              <TableHead>Wilayah (Provinsi & Kota)</TableHead>
              <TableHead>Koordinat (Lat, Lng)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sub-Data Terkait</TableHead>
              {authenticated && <TableHead className="text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={authenticated ? 7 : 6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Memuat data stasiun monitoring...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : stations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={authenticated ? 7 : 6} className="p-8">
                  <EmptyState
                    title="Tidak ada stasiun monitoring"
                    description={
                      searchQuery
                        ? "Tidak ditemukan stasiun yang cocok dengan kriteria pencarian."
                        : "Belum ada stasiun monitoring yang tercatat dalam sistem."
                    }
                    actionLabel={authenticated ? "Tambah Stasiun Pertama" : undefined}
                    onAction={authenticated ? handleOpenAddDialog : undefined}
                  />
                </TableCell>
              </TableRow>
            ) : (
              stations.map((s) => (
                <TableRow key={s.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono font-bold text-primary">
                    {s.station_code}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/monitoring/stations/${s.station_code || s.id}`}
                      className="font-semibold text-foreground hover:text-primary hover:underline transition-colors block"
                    >
                      {s.name}
                    </Link>
                    {s.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {s.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span className="font-medium text-foreground">{s.city}</span>
                      <span className="text-muted-foreground">{s.province}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground/60" />
                      <span>{Number(s.latitude).toFixed(4)}, {Number(s.longitude).toFixed(4)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs capitalize font-medium",
                        s.status === "aktif"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center flex-wrap gap-1.5">
                      <Link
                        href={`/monitoring/stations/${s.station_code || s.id}`}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 transition-colors"
                        title="Lihat Data Kualitas Air"
                      >
                        <Droplets className="h-3 w-3" />
                        {s.water_quality_count || 0} WQ
                      </Link>
                      <Link
                        href={`/monitoring/stations/${s.station_code || s.id}`}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-colors"
                        title="Lihat Data Plankton & Ubur-ubur"
                      >
                        <Bug className="h-3 w-3" />
                        {s.plankton_count || 0} PLK
                      </Link>
                      <Link
                        href={`/monitoring/stations/${s.station_code || s.id}`}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                        title="Lihat Kegiatan Sampling"
                      >
                        <Calendar className="h-3 w-3" />
                        {s.sampling_count || 0} SMP
                      </Link>
                      {s.bloom_events_count > 0 && (
                        <Link
                          href={`/monitoring/stations/${s.station_code || s.id}`}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors"
                          title="Lihat Kejadian Blooming Terkait"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          {s.bloom_events_count} Bloom
                        </Link>
                      )}
                    </div>
                  </TableCell>
                  {authenticated && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditDialog(s)}
                          title="Edit Stasiun"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleOpenDeleteDialog(s)}
                          title="Hapus Stasiun"
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

      {/* Dialog Add / Edit Station */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Stasiun Monitoring" : "Tambah Stasiun Monitoring"}
              </DialogTitle>
              <DialogDescription>
                Lengkapi formulir di bawah ini untuk menyimpan stasiun pemantauan pesisir.
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
                  <Label htmlFor="station_code">Kode Stasiun *</Label>
                  <Input
                    id="station_code"
                    placeholder="misal: ST-01"
                    value={formData.station_code}
                    onChange={(e) =>
                      setFormData({ ...formData, station_code: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="status">Status Operasional *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) =>
                      setFormData({
                        ...formData,
                        status: (val as "aktif" | "nonaktif") || "aktif",
                      })
                    }
                  >
                    <SelectTrigger id="status">
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
                <Label htmlFor="name">Nama Stasiun *</Label>
                <Input
                  id="name"
                  placeholder="misal: Teluk Jakarta, Pesisir Ambon"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="province">Provinsi *</Label>
                  <Input
                    id="province"
                    placeholder="misal: DKI Jakarta"
                    value={formData.province}
                    onChange={(e) =>
                      setFormData({ ...formData, province: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">Kabupaten / Kota *</Label>
                  <Input
                    id="city"
                    placeholder="misal: Jakarta Utara"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="latitude">Latitude (Lintang) *</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="-6.1000"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="longitude">Longitude (Bujur) *</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="106.8000"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Deskripsi / Catatan Lokasi</Label>
                <Input
                  id="description"
                  placeholder="Kondisi perairan, akses lokasi, atau catatan pemantauan..."
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
                onClick={() => setIsDialogOpen(false)}
                disabled={formSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Simpan Perubahan" : "Tambah Stasiun"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Konfirmasi Hapus Stasiun
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus stasiun monitoring{" "}
              <strong className="text-foreground">{deletingStation?.name} ({deletingStation?.station_code})</strong>?
              Tindakan ini tidak dapat dibatalkan.
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
              Hapus Stasiun
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
