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
import { Plus, Search, Bug, ChevronRight, Anchor, Download, Edit } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"

export default function PlanktonPage() {
  const { authenticated } = useAuth()

  const records = [
    { id: "PLK-101", sampling_id: "SMP-001", station: "Teluk Jakarta (ST-01)", type: "Fitoplankton", species: "Pyrodinium bahamense", density: "15,000", toxicity: "Beracun" },
    { id: "PLK-102", sampling_id: "SMP-002", station: "Teluk Ambon (ST-02)", type: "Zooplankton", species: "Copepoda", density: "5,000", toxicity: "Tidak" },
    { id: "JEL-103", sampling_id: "SMP-003", station: "Pesisir Selatan Jawa (ST-03)", type: "Ubur-ubur", species: "Aurelia aurita", density: "200", toxicity: "Iritasi Ringan" },
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
        <span className="font-semibold text-foreground">Plankton & Ubur-ubur</span>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Plankton & Ubur-ubur</h1>
          <p className="text-muted-foreground">Pencatatan kepadatan spesies penyebab HABs dan blooming ubur-ubur per stasiun monitoring.</p>
        </div>
        {authenticated && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Spesies
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground text-xs" />
          <Input type="search" placeholder="Cari spesies / ID / Stasiun..." className="pl-8" />
        </div>
        <Button variant="outline" className="ml-auto">
          <Download className="mr-2 h-4 w-4" />
          Ekspor CSV
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        {records.length === 0 ? (
          <EmptyState
            icon={Bug}
            title="Belum ada data plankton & ubur-ubur"
            description="Tambahkan data kelimpahan fitoplankton, zooplankton, atau ubur-ubur."
            actionLabel={authenticated ? "Tambah Spesies" : undefined}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Data</TableHead>
                <TableHead>ID Sampling</TableHead>
                <TableHead>Stasiun</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Spesies</TableHead>
                <TableHead>Kepadatan (sel/L atau ind/m²)</TableHead>
                <TableHead>Status Toksisitas</TableHead>
                {authenticated && <TableHead className="text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Bug className="h-4 w-4 text-primary" />
                      {r.id}
                    </div>
                  </TableCell>
                  <TableCell>{r.sampling_id}</TableCell>
                  <TableCell>{r.station}</TableCell>
                  <TableCell>{r.type}</TableCell>
                  <TableCell className="italic">{r.species}</TableCell>
                  <TableCell>{r.density}</TableCell>
                  <TableCell>
                    <Badge variant={r.toxicity === "Beracun" ? "destructive" : "secondary"}>
                      {r.toxicity}
                    </Badge>
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
