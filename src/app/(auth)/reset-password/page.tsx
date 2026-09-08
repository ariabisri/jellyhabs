"use client"

import * as React from "react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Waves,
  ShieldAlert,
  ArrowLeft,
  ShieldCheck,
  HelpCircle,
  UserCheck,
} from "lucide-react"

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[450px] w-[450px] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-10 right-10 h-[300px] w-[300px] rounded-full bg-accent-violet/10 blur-[90px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-lg">
        {/* Branding */}
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-accent-violet text-primary-foreground shadow-md glow-cyan">
            <Waves className="size-5" />
          </div>
          <span className="font-bold text-lg tracking-wide text-foreground">
            Jelly<span className="text-primary text-glow-cyan">Watch</span> <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">PRO</span>
          </span>
        </div>

        <Card className="w-full glass-card border border-border/50 shadow-xl">
          <CardHeader className="text-center pb-3">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <ShieldAlert className="size-6" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold">Pemulihan Kata Sandi</CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Pengaturan ulang kata sandi dikelola secara terpusat oleh Administrator sistem.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Security Notice */}
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/25 p-3.5 text-xs text-foreground/90 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-amber-500">
                <ShieldCheck className="size-4 shrink-0" />
                Kebijakan Keamanan Akun
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Untuk mencegah akses tanpa izin dan menjaga integritas data monitoring riset, fasilitas reset mandiri telah dinonaktifkan. Seluruh pengaturan ulang kata sandi dilakukan secara langsung oleh Administrator Sistem.
              </p>
            </div>

            {/* Steps Guide */}
            <div className="space-y-2.5 text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <HelpCircle className="size-4 text-primary" />
                Alur Permintaan Reset Kata Sandi:
              </span>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground bg-muted/30 p-4 rounded-lg border border-border/40 leading-relaxed">
                <li>
                  <strong className="text-foreground">Hubungi Administrator:</strong> Sampaikan permohonan pengaturan ulang kata sandi kepada Administrator sistem.
                </li>
                <li>
                  <strong className="text-foreground">Verifikasi Identitas:</strong> Berikan informasi nama lengkap dan email akun yang terdaftar pada sistem.
                </li>
                <li>
                  <strong className="text-foreground">Penerbitan Kata Sandi:</strong> Administrator akan memverifikasi akun Anda dan menyetel kata sandi sementara melalui modul administrasi.
                </li>
                <li>
                  <strong className="text-foreground">Login Kembali:</strong> Masuk ke sistem menggunakan kata sandi baru yang telah diterbitkan.
                </li>
              </ol>
            </div>

            {/* Verification Note */}
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs flex items-center gap-2.5 text-muted-foreground">
              <UserCheck className="size-4 text-primary shrink-0" />
              <span>
                Pastikan akun yang Anda minta reset merupakan akun resmi yang telah terdaftar di sistem JellyWatch Pro.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <Link
                href="/login"
                className={cn(buttonVariants(), "w-full font-semibold shadow-md flex items-center justify-center")}
              >
                <ArrowLeft className="mr-2 size-4" />
                Kembali ke Halaman Login
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
