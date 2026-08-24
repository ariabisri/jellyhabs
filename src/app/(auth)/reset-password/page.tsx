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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Waves, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password baru tidak cocok.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || "Gagal memperbarui password.")
        setLoading(false)
        return
      }

      setSuccessMessage(data.message || "Password berhasil diperbarui.")
      setLoading(false)

      setTimeout(() => {
        router.push("/login")
      }, 2500)
    } catch (err) {
      console.error("Reset password client error:", err)
      setError("Terjadi kesalahan jaringan. Silakan coba lagi nanti.")
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[100px] animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm">
        {/* Branding */}
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-accent-violet text-primary-foreground shadow-md glow-cyan">
            <Waves className="size-5" />
          </div>
          <span className="font-bold text-lg tracking-wide text-foreground">
            Jelly<span className="text-primary text-glow-cyan">Watch</span>
          </span>
        </div>

        <Card className="w-full glass-card border border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Reset Password</CardTitle>
            <CardDescription>
              Atur ulang password akun JellyWatch Anda.
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

              {successMessage && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-500 font-medium border border-emerald-500/20">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email">Email Terdaftar</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="aria@brin.go.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-background/50"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-background/50"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-background/50"
                />
              </div>

              <Button type="submit" className="w-full mt-2 font-semibold" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Simpan Password Baru"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center text-xs text-muted-foreground">
              Kembali ke halaman{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
