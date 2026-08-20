"use client"

import * as React from "react"
import Link from "next/link"
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
import { Plus, Search, Droplets, ChevronRight, Anchor, Download, Edit } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function WaterQualityPage() {
  const { authenticated } = useAuth()

  const records = [
    { id: "WQ-101", sampling_id: "SMP-001", station: "Teluk Jakarta (ST-01)", temp: "29.5", salinity: "32", do: "5.4", ph: "8.1", chlorophyll: "12.5" },
    { id: "WQ-102", sampling_id: "SMP-002", station: "Teluk Ambon (ST-02)", temp: "28.1", salinity: "30", do: "6.0", ph: "8.2", chlorophyll: "8.2" },
    { id: "WQ-103", sampling_id: "SMP-003", station: "Pesisir Selatan Jawa (ST-03)", temp: "30.2", salinity: "33", do: "4.8", ph: "7.9", chlorophyll: "45.0" },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Monitoring</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/monitoring/stations" className="hover:text-primary transition-colors flex items-center gap-1">
          <Anchor className="h-3.5 w-3.5" />
          Stasiun Monitoring
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground">Kualitas Air</span>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kualitas Air</h1>
          <p className="text-muted-foreground">Parameter lingkungan laut (Suhu, Salinitas, DO, pH, Klorofil-a) per stasiun monitoring.</p>
        </div>
        {authenticated && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Data
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Cari ID WQ / Sampling / Stasiun..." className="pl-8" />
        </div>
        <Button variant="outline" className="ml-auto">
          <Download className="mr-2 h-4 w-4" />
          Ekspor CSV
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        {records.length === 0 ? (
          <EmptyState
            icon={Droplets}
            title="Belum ada data kualitas air"
            description="Tambahkan data parameter lingkungan laut pertama untuk stasiun monitoring."
            actionLabel={authenticated ? "Tambah Data" : undefined}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID WQ</TableHead>
                <TableHead>ID Sampling</TableHead>
                <TableHead>Stasiun</TableHead>
                <TableHead>Suhu (°C)</TableHead>
                <TableHead>Salinitas (psu)</TableHead>
                <TableHead>DO (mg/L)</TableHead>
                <TableHead>pH</TableHead>
                <TableHead>Klorofil-a (µg/L)</TableHead>
                {authenticated && <TableHead className="text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-primary" />
                      {r.id}
                    </div>
                  </TableCell>
                  <TableCell>{r.sampling_id}</TableCell>
                  <TableCell>{r.station}</TableCell>
                  <TableCell>{r.temp}</TableCell>
                  <TableCell>{r.salinity}</TableCell>
                  <TableCell>{r.do}</TableCell>
                  <TableCell>{r.ph}</TableCell>
                  <TableCell className={Number(r.chlorophyll) > 20 ? "text-destructive font-bold" : ""}>
                    {r.chlorophyll}
                  </TableCell>
                  {authenticated && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
