"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Search, Calendar, MapPin, ChevronRight, Download } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function SamplingPage() {
  const { authenticated } = useAuth()

  const samplings = [
    { id: "SMP-001", date: "2026-07-01", station: "Teluk Jakarta (ST-01)", weather: "Cerah", notes: "Air surut, arus tenang." },
    { id: "SMP-002", date: "2026-07-02", station: "Teluk Banten (ST-02)", weather: "Berawan", notes: "Sedikit bergelombang." },
    { id: "SMP-003", date: "2026-07-05", station: "Pekalongan (ST-03)", weather: "Hujan Ringan", notes: "Kekeruhan air tinggi." },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Monitoring</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground">Sampling Event</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sampling Event</h1>
          <p className="text-muted-foreground">Catatan jadwal dan log pengambilan sampel di stasiun monitoring.</p>
        </div>
        {authenticated && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Sampling
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Cari ID / catatan..." className="pl-8" />
        </div>
        <Button variant="outline" className="ml-2">Filter Tanggal</Button>
        <Button variant="outline" className="ml-auto">
          <Download className="mr-2 h-4 w-4" />
          Ekspor CSV
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode Sampling</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Stasiun</TableHead>
              <TableHead>Cuaca</TableHead>
              <TableHead>Catatan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {samplings.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {s.date}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {s.station}
                  </div>
                </TableCell>
                <TableCell>{s.weather}</TableCell>
                <TableCell className="max-w-[200px] truncate">{s.notes}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Detail</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
