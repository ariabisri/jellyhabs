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
import { Plus, Search, Droplets } from "lucide-react"

export default function WaterQualityPage() {
  const records = [
    { id: "WQ-101", sampling_id: "SMP-001", temp: "29.5", salinity: "32", do: "5.4", ph: "8.1", chlorophyll: "12.5" },
    { id: "WQ-102", sampling_id: "SMP-002", temp: "28.1", salinity: "30", do: "6.0", ph: "8.2", chlorophyll: "8.2" },
    { id: "WQ-103", sampling_id: "SMP-003", temp: "30.2", salinity: "33", do: "4.8", ph: "7.9", chlorophyll: "45.0" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kualitas Air</h1>
          <p className="text-muted-foreground">Parameter lingkungan laut (Suhu, Salinitas, DO, pH, Klorofil-a).</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Data
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Cari ID WQ / Sampling..." className="pl-8" />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID WQ</TableHead>
              <TableHead>ID Sampling</TableHead>
              <TableHead>Suhu (°C)</TableHead>
              <TableHead>Salinitas (psu)</TableHead>
              <TableHead>DO (mg/L)</TableHead>
              <TableHead>pH</TableHead>
              <TableHead>Klorofil-a (µg/L)</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
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
                <TableCell>{r.temp}</TableCell>
                <TableCell>{r.salinity}</TableCell>
                <TableCell>{r.do}</TableCell>
                <TableCell>{r.ph}</TableCell>
                <TableCell className={Number(r.chlorophyll) > 20 ? "text-destructive font-bold" : ""}>
                  {r.chlorophyll}
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
