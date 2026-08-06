import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Waves } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-accent-violet/10 blur-[100px] animate-pulse [animation-delay:1.5s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[80px] animate-pulse [animation-delay:3s]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm">
        {/* Branding */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-accent-violet text-primary-foreground shadow-lg glow-cyan">
            <Waves className="size-7" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-2xl font-bold tracking-wide text-foreground">
              Jelly<span className="text-primary text-glow-cyan">Watch</span> <span className="text-primary font-extrabold">PRO</span>
            </h1>
            <p className="text-xs text-muted-foreground font-medium">Bioluminescent Marine & HABs Monitoring System</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="w-full glass-card">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Masuk ke Akun</CardTitle>
            <CardDescription>
              Masukkan kredensial Anda untuk mengakses sistem monitoring.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@brin.go.id"
                  required
                  className="bg-background/50"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/reset-password" className="ml-auto inline-block text-xs text-primary hover:text-primary/80 transition-colors">
                    Lupa password?
                  </Link>
                </div>
                <Input id="password" type="password" required className="bg-background/50" />
              </div>
              <Button type="submit" className="w-full mt-1">
                Masuk
              </Button>
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">atau</span>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Masuk dengan Google
              </Button>
            </div>
            <div className="mt-4 text-center text-xs text-muted-foreground">
              Belum punya akun?{" "}
              <Link href="#" className="text-primary hover:text-primary/80 transition-colors font-medium">
                Hubungi Admin
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground/60 text-center">
          &copy; 2026 JellyWatch Pro &mdash; Badan Riset dan Inovasi Nasional (BRIN)
        </p>
      </div>
    </div>
  )
}
