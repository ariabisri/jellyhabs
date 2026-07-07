import { DynamicMap } from "@/components/map/dynamic-map"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function WebGISPage() {
  const dummyMarkers = [
    { id: "1", lat: -5.9, lng: 106.1, title: "Stasiun Teluk Banten" },
    { id: "2", lat: -6.0, lng: 106.8, title: "Stasiun Teluk Jakarta" },
    { id: "3", lat: -6.9, lng: 109.5, title: "Stasiun Pekalongan" },
    { id: "4", lat: -7.2, lng: 112.7, title: "Stasiun Tanjung Perak" },
  ];

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-8rem)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">WebGIS Interaktif</h1>
        <p className="text-muted-foreground">
          Peta interaktif sebaran stasiun monitoring dan kejadian HABs.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 h-full">
        <Card className="col-span-1 h-full flex flex-col">
          <CardHeader>
            <CardTitle>Filter Peta</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 flex-1 overflow-auto">
            <div className="grid gap-2">
              <Label htmlFor="search">Cari Lokasi / Stasiun</Label>
              <Input id="search" placeholder="Masukkan nama stasiun..." />
            </div>
            
            <div className="mt-4 flex flex-col gap-2">
              <Label>Layer Tampilan</Label>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="layer-stations" defaultChecked className="rounded border-gray-300" />
                <Label htmlFor="layer-stations" className="font-normal cursor-pointer">Stasiun Monitoring</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="layer-habs" defaultChecked className="rounded border-gray-300" />
                <Label htmlFor="layer-habs" className="font-normal cursor-pointer">Kejadian HABs</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="layer-jelly" defaultChecked className="rounded border-gray-300" />
                <Label htmlFor="layer-jelly" className="font-normal cursor-pointer">Jellyfish Bloom</Label>
              </div>
            </div>
            
            <div className="mt-auto pt-4">
              <Button className="w-full">Terapkan Filter</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-3 h-full overflow-hidden">
          <CardContent className="p-0 h-full relative z-0">
            <DynamicMap markers={dummyMarkers} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
