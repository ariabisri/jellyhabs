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
import { Plus, Search, Bug } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function PlanktonPage() {
  const records = [
    { id: "PLK-101", sampling_id: "SMP-001", type: "Fitoplankton", species: "Pyrodinium bahamense", density: "15000", toxicity: "Beracun" },
    { id: "PLK-102", sampling_id: "SMP-002", type: "Zooplankton", species: "Copepoda", density: "5000", toxicity: "Tidak" },
    { id: "JEL-103", sampling_id: "SMP-003", type: "Ubur-ubur", species: "Aurelia aurita", density: "200", toxicity: "Iritasi Ringan" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Plankton & Ubur-ubur</h1>
          <p className="text-muted-foreground">Pencatatan kepadatan spesies penyebab HABs dan blooming ubur-ubur.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Spesies
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Cari spesies / ID..." className="pl-8" />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Data</TableHead>
              <TableHead>ID Sampling</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Spesies</TableHead>
              <TableHead>Kepadatan (sel/L atau ind/m²)</TableHead>
              <TableHead>Status Toksisitas</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
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
                <TableCell>{r.type}</TableCell>
                <TableCell className="italic">{r.species}</TableCell>
                <TableCell>{r.density}</TableCell>
                <TableCell>
                  <Badge variant={r.toxicity === "Beracun" ? "destructive" : "secondary"}>
                    {r.toxicity}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
