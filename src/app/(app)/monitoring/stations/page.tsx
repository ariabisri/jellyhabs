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
import { Plus, Search } from "lucide-react"

export default function StationsPage() {
  const stations = [
    { id: "ST-01", name: "Teluk Jakarta", prov: "DKI Jakarta", city: "Jakarta Utara", lat: -6.1, lng: 106.8 },
    { id: "ST-02", name: "Teluk Banten", prov: "Banten", city: "Serang", lat: -5.9, lng: 106.1 },
    { id: "ST-03", name: "Pekalongan", prov: "Jawa Tengah", city: "Pekalongan", lat: -6.8, lng: 109.6 },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stasiun Monitoring</h1>
          <p className="text-muted-foreground">Kelola daftar stasiun lokasi pemantauan kualitas air dan plankton.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Stasiun
        </Button>
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
              <TableHead>Latitude</TableHead>
              <TableHead>Longitude</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stations.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.id}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.prov}</TableCell>
                <TableCell>{s.city}</TableCell>
                <TableCell>{s.lat}</TableCell>
                <TableCell>{s.lng}</TableCell>
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
