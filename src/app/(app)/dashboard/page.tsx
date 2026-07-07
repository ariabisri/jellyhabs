import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Activity, Anchor, Bug, Droplets } from "lucide-react"
import { LineChart } from "@/components/charts/line-chart"
import { BarChart } from "@/components/charts/bar-chart"

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Ringkasan data monitoring dan kejadian HABs / Jellyfish Bloom.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stasiun</CardTitle>
            <Anchor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+2 sejak bulan lalu</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sampling</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,024</div>
            <p className="text-xs text-muted-foreground">+105 sejak bulan lalu</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HABs Events</CardTitle>
            <Activity className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 status siaga merah</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jellyfish Blooms</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Area pelabuhan terdampak</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Tren Kualitas Air (Klorofil-a)</CardTitle>
            <CardDescription>Rata-rata mingguan untuk stasiun Teluk Jakarta</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <LineChart 
              title=""
              xAxisData={["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4", "Minggu 5", "Minggu 6"]}
              seriesData={[12.5, 14.2, 23.4, 38.1, 45.0, 31.2]}
            />
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Distribusi Kejadian</CardTitle>
            <CardDescription>Jumlah laporan per provinsi</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart 
              title=""
              xAxisData={["DKI", "Banten", "Jabar", "Jateng"]}
              seriesData={[12, 5, 8, 3]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
