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
import { Plus, Search, Droplets, Bug, Anchor } from "lucide-react"
import { cn } from "@/lib/utils"

export default function StationsPage() {
  const stations = [
    { id: "ST-01", name: "Teluk Jakarta", prov: "DKI Jakarta", city: "Jakarta Utara", lat: -6.1, lng: 106.8, wqCount: 14, plkCount: 8 },
    { id: "ST-02", name: "Teluk Ambon", prov: "Maluku", city: "Ambon", lat: 3.71, lng: 128.13, wqCount: 9, plkCount: 5 },
    { id: "ST-03", name: "Pesisir Selatan Jawa", prov: "Jawa Tengah", city: "Yogyakarta", lat: -6.8, lng: 109.6, wqCount: 18, plkCount: 12 },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Anchor className="h-7 w-7 text-primary" />
            Stasiun Monitoring
          </h1>
          <p className="text-muted-foreground">Kelola daftar stasiun lokasi pemantauan kualitas air dan plankton.</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/monitoring/stations/water-quality"
            className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}
          >
            <Droplets className="mr-2 h-4 w-4 text-primary" />
            Data Kualitas Air
          </a>
          <a
            href="/monitoring/stations/plankton"
            className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}
          >
            <Bug className="mr-2 h-4 w-4 text-primary" />
            Data Plankton
          </a>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Stasiun
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Cari stasiun..." className="pl-8" />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama Stasiun</TableHead>
              <TableHead>Provinsi</TableHead>
              <TableHead>Kab/Kota</TableHead>
              <TableHead>Koor. (Lat, Lng)</TableHead>
              <TableHead>Sub-Data Terkait</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stations.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.id}</TableCell>
                <TableCell>
                  <a href={`/monitoring/stations/${s.id}`} className="font-semibold text-primary hover:underline transition-colors">
                    {s.name}
                  </a>
                </TableCell>
                <TableCell>{s.prov}</TableCell>
                <TableCell>{s.city}</TableCell>
                <TableCell className="font-mono text-xs">{s.lat}, {s.lng}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/monitoring/stations/${s.id}`}
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      title="Lihat Data Kualitas Air"
                    >
                      <Droplets className="h-3 w-3" />
                      {s.wqCount} WQ
                    </a>
                    <a
                      href={`/monitoring/stations/${s.id}`}
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-accent-violet/10 text-accent-violet hover:bg-accent-violet/20 transition-colors"
                      title="Lihat Data Plankton & Ubur-ubur"
                    >
                      <Bug className="h-3 w-3" />
                      {s.plkCount} PLK
                    </a>
                  </div>
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
