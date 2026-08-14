import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Activity, Anchor, Bug, Droplets, TrendingUp, TrendingDown, ArrowRight } from "lucide-react"
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
        <a href="/monitoring/stations" className="group">
          <Card className="h-full transition-all duration-200 group-hover:border-primary/40 group-hover:shadow-[0_0_15px_rgba(0,180,216,0.1)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stasiun</CardTitle>
              <Anchor className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500 font-medium">+2</span> sejak bulan lalu
              </p>
            </CardContent>
          </Card>
        </a>
        
        <a href="/monitoring/sampling" className="group">
          <Card className="h-full transition-all duration-200 group-hover:border-primary/40 group-hover:shadow-[0_0_15px_rgba(0,180,216,0.1)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sampling</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,024</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500 font-medium">+105</span> sejak bulan lalu
              </p>
            </CardContent>
          </Card>
        </a>
        
        <a href="/events/habs" className="group">
          <Card className="h-full transition-all duration-200 group-hover:border-destructive/40 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">HABs Events</CardTitle>
              <Activity className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs flex items-center gap-1">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-destructive/10 text-destructive text-[10px] font-semibold">
                  3 Siaga
                </span>
                <span className="text-muted-foreground">status merah</span>
              </p>
            </CardContent>
          </Card>
        </a>
        
        <a href="/events/habs" className="group">
          <Card className="h-full transition-all duration-200 group-hover:border-primary/40 group-hover:shadow-[0_0_15px_rgba(0,180,216,0.1)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jellyfish Blooms</CardTitle>
              <Bug className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500 font-medium">-2</span> area pelabuhan terdampak
              </p>
            </CardContent>
          </Card>
        </a>
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
              yAxisLabel="µg/L"
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
              yAxisLabel="Jumlah Laporan"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
