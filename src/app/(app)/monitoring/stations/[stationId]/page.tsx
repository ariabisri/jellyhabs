"use client"

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
} from "lucide-react"
import { use, useState } from "react"

// Dummy data - would come from API/DB in production
const stationsData: Record<string, {
  id: string; name: string; prov: string; city: string; lat: number; lng: number;
  waterQuality: { id: string; sampling_id: string; temp: string; salinity: string; do_val: string; ph: string; chlorophyll: string; date: string }[];
  plankton: { id: string; sampling_id: string; type: string; species: string; density: string; toxicity: string }[];
  sampling: { id: string; date: string; weather: string; notes: string }[];
}> = {
  "ST-01": {
    id: "ST-01", name: "Teluk Jakarta", prov: "DKI Jakarta", city: "Jakarta Utara", lat: -6.1, lng: 106.8,
    waterQuality: [
      { id: "WQ-101", sampling_id: "SMP-001", temp: "29.5", salinity: "32", do_val: "5.4", ph: "8.1", chlorophyll: "12.5", date: "2026-07-01" },
      { id: "WQ-104", sampling_id: "SMP-004", temp: "30.1", salinity: "31", do_val: "5.0", ph: "8.0", chlorophyll: "38.2", date: "2026-07-10" },
    ],
    plankton: [
      { id: "PLK-101", sampling_id: "SMP-001", type: "Fitoplankton", species: "Pyrodinium bahamense", density: "15,000", toxicity: "Beracun" },
      { id: "PLK-104", sampling_id: "SMP-004", type: "Zooplankton", species: "Copepoda", density: "3,200", toxicity: "Tidak" },
    ],
    sampling: [
      { id: "SMP-001", date: "2026-07-01", weather: "Cerah", notes: "Air surut, arus tenang." },
      { id: "SMP-004", date: "2026-07-10", weather: "Cerah Berawan", notes: "Pasang tinggi." },
    ],
  },
  "ST-02": {
    id: "ST-02", name: "Teluk Ambon", prov: "Maluku", city: "Ambon", lat: 3.71, lng: 128.13,
    waterQuality: [
      { id: "WQ-102", sampling_id: "SMP-002", temp: "28.1", salinity: "30", do_val: "6.0", ph: "8.2", chlorophyll: "8.2", date: "2026-07-02" },
    ],
    plankton: [
      { id: "PLK-102", sampling_id: "SMP-002", type: "Zooplankton", species: "Copepoda", density: "5,000", toxicity: "Tidak" },
    ],
    sampling: [
      { id: "SMP-002", date: "2026-07-02", weather: "Berawan", notes: "Sedikit bergelombang." },
    ],
  },
  "ST-03": {
    id: "ST-03", name: "Pesisir Selatan Jawa", prov: "Jawa Tengah", city: "Yogyakarta", lat: -6.8, lng: 109.6,
    waterQuality: [
      { id: "WQ-103", sampling_id: "SMP-003", temp: "30.2", salinity: "33", do_val: "4.8", ph: "7.9", chlorophyll: "45.0", date: "2026-07-05" },
    ],
    plankton: [
      { id: "JEL-103", sampling_id: "SMP-003", type: "Ubur-ubur", species: "Aurelia aurita", density: "200", toxicity: "Iritasi Ringan" },
    ],
    sampling: [
      { id: "SMP-003", date: "2026-07-05", weather: "Hujan Ringan", notes: "Kekeruhan air tinggi." },
    ],
  },
}

type TabKey = "info" | "water-quality" | "plankton" | "sampling"

export default function StationDetailPage({ params }: { params: Promise<{ stationId: string }> }) {
  const { stationId } = use(params)
  const [activeTab, setActiveTab] = useState<TabKey>("info")

  const station = stationsData[stationId]

  if (!station) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Anchor className="h-12 w-12 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-muted-foreground">Stasiun tidak ditemukan</h2>
        <p className="text-sm text-muted-foreground">Stasiun dengan kode &ldquo;{stationId}&rdquo; tidak ada dalam sistem.</p>
        <a href="/monitoring/stations">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Stasiun
          </Button>
        </a>
      </div>
    )
  }

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "info", label: "Info Stasiun" },
    { key: "water-quality", label: "Kualitas Air", count: station.waterQuality.length },
    { key: "plankton", label: "Plankton & Ubur-ubur", count: station.plankton.length },
    { key: "sampling", label: "Sampling Event", count: station.sampling.length },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Monitoring</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <a href="/monitoring/stations" className="hover:text-primary transition-colors flex items-center gap-1">
          <Anchor className="h-3.5 w-3.5" />
          Stasiun Monitoring
        </a>
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
            <h1 className="text-2xl font-bold tracking-tight">{station.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {station.city}, {station.prov} &mdash;
              <span className="font-mono text-xs">{station.lat}, {station.lng}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="/monitoring/stations">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          </a>
          <Button size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit Stasiun
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-all relative ${
              activeTab === tab.key
                ? "text-primary border-b-2 border-primary -mb-px"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Kode Stasiun</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono">{station.id}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sampling</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{station.sampling.length}</p>
              <p className="text-xs text-muted-foreground">event tercatat</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Data Tersedia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                  <Droplets className="h-3 w-3" />
                  {station.waterQuality.length} WQ
                </span>
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-accent-violet/10 text-accent-violet">
                  <Bug className="h-3 w-3" />
                  {station.plankton.length} PLK
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "water-quality" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-primary" />
              Data Kualitas Air &mdash; {station.name}
            </CardTitle>
            <CardDescription>Parameter lingkungan laut yang tercatat di stasiun ini.</CardDescription>
          </CardHeader>
          <CardContent>
            {station.waterQuality.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Droplets className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">Belum ada data kualitas air</p>
                <p className="text-xs mt-1">Data akan muncul setelah sampling dilakukan.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Suhu (°C)</TableHead>
                    <TableHead>Salinitas (psu)</TableHead>
                    <TableHead>DO (mg/L)</TableHead>
                    <TableHead>pH</TableHead>
                    <TableHead>Klorofil-a (µg/L)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {station.waterQuality.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.id}</TableCell>
                      <TableCell>{r.date}</TableCell>
                      <TableCell>{r.temp}</TableCell>
                      <TableCell>{r.salinity}</TableCell>
                      <TableCell>{r.do_val}</TableCell>
                      <TableCell>{r.ph}</TableCell>
                      <TableCell className={Number(r.chlorophyll) > 20 ? "text-destructive font-bold" : ""}>{r.chlorophyll}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "plankton" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" />
              Data Plankton & Ubur-ubur &mdash; {station.name}
            </CardTitle>
            <CardDescription>Spesies yang tercatat dari sampling di stasiun ini.</CardDescription>
          </CardHeader>
          <CardContent>
            {station.plankton.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bug className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">Belum ada data plankton</p>
                <p className="text-xs mt-1">Data akan muncul setelah sampling dilakukan.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Spesies</TableHead>
                    <TableHead>Kepadatan</TableHead>
                    <TableHead>Toksisitas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {station.plankton.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.id}</TableCell>
                      <TableCell>{r.type}</TableCell>
                      <TableCell className="italic">{r.species}</TableCell>
                      <TableCell>{r.density}</TableCell>
                      <TableCell>
                        <Badge variant={r.toxicity === "Beracun" ? "destructive" : "secondary"}>{r.toxicity}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "sampling" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Sampling Event &mdash; {station.name}
            </CardTitle>
            <CardDescription>Riwayat pengambilan sampel di stasiun ini.</CardDescription>
          </CardHeader>
          <CardContent>
            {station.sampling.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Calendar className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">Belum ada sampling event</p>
                <p className="text-xs mt-1">Buat jadwal sampling baru untuk stasiun ini.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Sampling</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Cuaca</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {station.sampling.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.id}</TableCell>
                      <TableCell>{s.date}</TableCell>
                      <TableCell>{s.weather}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{s.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
