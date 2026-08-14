"use client"

import * as React from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Search, FileText, Download, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

export default function DatasetPage() {
  const { authenticated } = useAuth()

  const datasets = [
    { id: "DS-01", name: "Data Kualitas Air Teluk Jakarta 2025", format: "CSV", size: "2.5 MB", uploader: "Dr. Budi", date: "2026-01-15" },
    { id: "DS-02", name: "Laporan Distribusi Spesies HABs", format: "PDF", size: "5.1 MB", uploader: "Siti Aminah", date: "2026-03-22" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Dataset</h1>
          <p className="text-muted-foreground">Unduh atau unggah dataset publikasi dan hasil analisis mentah.</p>
        </div>
        {authenticated ? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Unggah Dataset
          </Button>
        ) : (
          <a
            href="/login"
            className={cn(buttonVariants({ variant: "default" }), "gap-1.5 shadow-md")}
            title="Silakan login untuk mengunggah dataset"
          >
            <Lock className="h-4 w-4" />
            <span>Login untuk Unggah Data</span>
          </a>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Cari nama dataset..." className="pl-8" />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Berkas</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Ukuran</TableHead>
              <TableHead>Diunggah Oleh</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {datasets.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {d.name}
                  </div>
                </TableCell>
                <TableCell>{d.format}</TableCell>
                <TableCell>{d.size}</TableCell>
                <TableCell>{d.uploader}</TableCell>
                <TableCell>{d.date}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Unduh
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
