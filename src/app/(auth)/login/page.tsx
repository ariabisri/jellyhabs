"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Waves,
  Loader2,
  AlertCircle,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
} from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Admin contact modal state
  const [contactAdminOpen, setContactAdminOpen] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || "Login gagal. Silakan periksa kembali email dan password Anda.")
        setLoading(false)
        return
      }

      // Success
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      console.error("Login client error:", err)
      setError("Terjadi kesalahan jaringan. Silakan coba lagi nanti.")
      setLoading(false)
    }
  }

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
        <Card className="w-full glass-card border border-border/50 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Masuk ke Akun</CardTitle>
            <CardDescription>
              Masukkan kredensial Anda untuk mengakses sistem monitoring.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive font-medium border border-destructive/20">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@brin.go.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-background/50"
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => setContactAdminOpen(true)}
                    className="ml-auto inline-block text-xs text-primary hover:text-primary/80 transition-colors font-medium hover:underline focus:outline-none"
                  >
                    Lupa password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-background/50"
                />
              </div>

              <Button type="submit" className="w-full mt-1 font-semibold" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              Belum punya akun atau kendala login?{" "}
              <button
                type="button"
                onClick={() => setContactAdminOpen(true)}
                className="text-primary hover:text-primary/80 transition-colors font-semibold hover:underline focus:outline-none inline"
              >
                Hubungi Admin
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground/60 text-center">
          &copy; 2026 JellyWatch Pro &mdash; Badan Riset dan Inovasi Nasional (BRIN)
        </p>
      </div>

      {/* Contact Admin Modal Dialog */}
      <Dialog open={contactAdminOpen} onOpenChange={setContactAdminOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <ShieldAlert className="size-5" />
              <DialogTitle className="text-base sm:text-lg">Bantuan Akun & Reset Kata Sandi</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Pengaturan ulang kata sandi dikelola secara terpusat oleh Administrator sistem demi keamanan data riset.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/25 p-3 text-foreground/90 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-amber-500">
                <ShieldCheck className="size-3.5 shrink-0" />
                Kebijakan Keamanan Akun
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Untuk mencegah akses tidak sah, pengaturan ulang kata sandi dilakukan secara langsung oleh Administrator sistem melalui verifikasi pengguna.
              </p>
            </div>

            <div className="rounded-lg bg-muted/40 p-3.5 border border-border/50 space-y-1.5">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <HelpCircle className="size-3.5 text-primary" />
                Instruksi Pengguna:
              </span>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                Silakan hubungi Administrator sistem secara langsung dengan menginformasikan <strong>Nama lengkap</strong> dan <strong>Email terdaftar</strong> Anda. Administrator akan mengatur ulang kata sandi baru untuk akun Anda.
              </p>
            </div>

            <div className="text-center pt-0.5">
              <Link
                href="/reset-password"
                onClick={() => setContactAdminOpen(false)}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
              >
                <span>Buka halaman panduan lengkap</span>
                <ExternalLink className="size-3" />
              </Link>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              className="w-full font-semibold"
              onClick={() => setContactAdminOpen(false)}
            >
              Mengerti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
