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
import { EmptyState } from "@/components/ui/empty-state"
import { Plus, Search, AlertTriangle, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"

export default function EventsPage() {
  const { authenticated } = useAuth()

  const events = [
    { id: "EVT-202607-01", date: "2026-07-02", station: "Teluk Jakarta", type: "Harmful Algal Blooms", status: "Siaga", source: "Laporan Lapangan" },
    { id: "EVT-202607-02", date: "2026-07-03", station: "Pekalongan", type: "Jellyfish Bloom", status: "Waspada", source: "Laporan Masyarakat" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kejadian (Events)</h1>
          <p className="text-muted-foreground">Catatan peringatan kejadian blooming alga berbahaya dan ubur-ubur.</p>
        </div>
        {authenticated && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Catat Kejadian
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Cari kejadian..." className="pl-8" />
        </div>
        <Button variant="outline" className="ml-auto">
          <Download className="mr-2 h-4 w-4" />
          Ekspor CSV
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        {events.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Belum ada laporan kejadian"
            description="Tidak ada catatan kejadian HABs atau blooming ubur-ubur terdeteksi."
            actionLabel={authenticated ? "Catat Kejadian" : undefined}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Kejadian</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Jenis Kejadian</TableHead>
                <TableHead>Sumber Laporan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      {e.id}
                    </div>
                  </TableCell>
                  <TableCell>{e.date}</TableCell>
                  <TableCell>{e.station}</TableCell>
                  <TableCell>{e.type}</TableCell>
                  <TableCell>{e.source}</TableCell>
                  <TableCell>
                    <Badge variant={e.status === "Siaga" ? "destructive" : "default"}>
                      {e.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Detail / Validasi</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
