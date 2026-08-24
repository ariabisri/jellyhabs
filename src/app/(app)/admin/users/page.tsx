"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Loader2, Edit, Trash2, Shield, User, AlertCircle, RefreshCw, Lock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface RoleItem {
  id: string
  name: string
  description?: string
}

interface UserItem {
  id: string
  full_name: string
  email: string
  status: "aktif" | "nonaktif" | "suspended" | string
  avatar_url?: string | null
  role_id: string
  role_name: string
  last_login_at?: string | null
  created_at: string
}

export default function UsersPage() {
  const router = useRouter()
  const { user: authUser, loading: authLoading, authenticated } = useAuth()

  const [users, setUsers] = React.useState<UserItem[]>([])
  const [roles, setRoles] = React.useState<RoleItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  // Modal State
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<UserItem | null>(null)
  const [saving, setSaving] = React.useState(false)

  // Form State
  const [formFullName, setFormFullName] = React.useState("")
  const [formEmail, setFormEmail] = React.useState("")
  const [formPassword, setFormPassword] = React.useState("")
  const [formRoleId, setFormRoleId] = React.useState("")
  const [formStatus, setFormStatus] = React.useState<string>("aktif")

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [deletingUser, setDeletingUser] = React.useState<UserItem | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  // Route Guard: Protect User Management from unauthenticated & non-admin users
  React.useEffect(() => {
    if (!authLoading) {
      if (!authenticated || authUser?.role !== "Admin") {
        router.push("/login")
      }
    }
  }, [authLoading, authenticated, authUser, router])

  // Fetch Roles & Users
  const fetchRoles = React.useCallback(async () => {
    try {
      const res = await fetch("/api/roles")
      const data = await res.json()
      if (data.success) {
        setRoles(data.data || [])
      }
    } catch (err) {
      console.error("Failed to load roles:", err)
    }
  }, [])

  const fetchUsers = React.useCallback(async (queryStr = "") => {
    setLoading(true)
    setError(null)
    try {
      const url = queryStr
        ? `/api/users?q=${encodeURIComponent(queryStr)}`
        : "/api/users"
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setUsers(data.data || [])
      } else {
        setError(data.error || "Gagal memuat daftar pengguna")
      }
    } catch (err) {
      console.error("Failed to load users:", err)
      setError("Terjadi kesalahan koneksi saat memuat data pengguna")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (authenticated && authUser?.role === "Admin") {
      const timer = setTimeout(() => {
        fetchRoles()
        fetchUsers()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [authenticated, authUser, fetchRoles, fetchUsers])

  // Search filter debounce
  React.useEffect(() => {
    if (!authenticated || authUser?.role !== "Admin") return
    const timer = setTimeout(() => {
      fetchUsers(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, authenticated, authUser, fetchUsers])

  const selectedRoleName = React.useMemo(() => {
    const found = roles.find((r) => r.id === formRoleId)
    return found ? found.name : ""
  }, [roles, formRoleId])

  const selectedStatusName = React.useMemo(() => {
    if (!formStatus) return ""
    return formStatus.charAt(0).toUpperCase() + formStatus.slice(1)
  }, [formStatus])

  if (authLoading || !authenticated || authUser?.role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Lock className="h-12 w-12 text-primary mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-foreground mb-1">Akses Terbatas</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Halaman Manajemen Pengguna memerlukan hak akses Administrator. Mengalihkan ke halaman login...
        </p>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingUser(null)
    setFormFullName("")
    setFormEmail("")
    setFormPassword("")
    setFormRoleId(roles[0]?.id || "")
    setFormStatus("aktif")
    setError(null)
    setDialogOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user)
    setFormFullName(user.full_name)
    setFormEmail(user.email)
    setFormPassword("") // Optional on edit
    setFormRoleId(user.role_id)
    setFormStatus(user.status)
    setError(null)
    setDialogOpen(true)
  }

  // Handle Create / Edit Save
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const isEdit = Boolean(editingUser)
      const url = isEdit ? `/api/users/${editingUser?.id}` : "/api/users"
      const method = isEdit ? "PUT" : "POST"

      const payload: Record<string, string> = {
        full_name: formFullName,
        email: formEmail,
        role_id: formRoleId,
        status: formStatus,
      }

      if (formPassword.trim()) {
        payload.password = formPassword
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || "Gagal menyimpan data pengguna")
        setSaving(false)
        return
      }

      setDialogOpen(false)
      fetchUsers(searchQuery)
    } catch (err) {
      console.error("Save user error:", err)
      setError("Terjadi kesalahan sistem saat menyimpan data pengguna")
    } finally {
      setSaving(false)
    }
  }

  // Open Delete Confirmation
  const handleOpenDelete = (user: UserItem) => {
    setDeletingUser(user)
    setDeleteDialogOpen(true)
  }

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingUser) return
    setDeleting(true)

    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, {
        method: "DELETE",
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || "Gagal menghapus pengguna")
        setDeleting(false)
        return
      }

      setDeleteDialogOpen(false)
      setDeletingUser(null)
      fetchUsers(searchQuery)
    } catch (err) {
      console.error("Delete user error:", err)
      setError("Gagal menghapus pengguna. Silakan coba lagi.")
    } finally {
      setDeleting(false)
    }
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <User className="h-7 w-7 text-primary" />
            Manajemen Pengguna
          </h1>
          <p className="text-muted-foreground">Kelola hak akses, peranan (role), dan status aktif pengguna sistem.</p>
        </div>
        <Button onClick={handleOpenCreate} className="font-semibold shadow-md">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pengguna
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive font-medium border border-destructive/20">
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="outline" size="sm" onClick={() => fetchUsers(searchQuery)}>
            <RefreshCw className="mr-1 size-3.5" />
            Coba Lagi
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari nama / email pengguna..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 bg-card"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mr-2 text-primary" />
            <span>Memuat data pengguna...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <User className="h-12 w-12 mb-3 opacity-20" />
            <p className="font-semibold text-lg">Tidak ada pengguna ditemukan</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? "Tidak ada hasil yang cocok dengan kata kunci pencarian." : "Belum ada data pengguna di dalam database."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role / Peran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-semibold text-foreground">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-xs shrink-0">
                        {u.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span>{u.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1 font-medium bg-background">
                      <Shield className="size-3 text-primary" />
                      {u.role_name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        u.status === "aktif"
                          ? "default"
                          : u.status === "suspended"
                          ? "destructive"
                          : "secondary"
                      }
                      className="capitalize"
                    >
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(u)}
                        className="hover:bg-primary/10 hover:text-primary transition-colors"
                        title="Edit User"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDelete(u)}
                        className="hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
                        title="Hapus User"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Hapus</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialog Form Create / Edit User */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit Data Pengguna" : "Tambah Pengguna Baru"}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Perbarui informasi akun pengguna dan otoritas peran di sistem."
                : "Isi data formulir berikut untuk mendaftarkan akun baru ke sistem."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveUser} className="grid gap-4 py-2">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive font-medium border border-destructive/20">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="full_name">Nama Lengkap</Label>
              <Input
                id="full_name"
                value={formFullName}
                onChange={(e) => setFormFullName(e.target.value)}
                placeholder="e.g. Dr. Hanung Agus Mulyadi"
                required
                disabled={saving}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email Login</Label>
              <Input
                id="email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="nama@brin.go.id"
                required
                disabled={saving}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">
                {editingUser ? "Password Baru (Opsional)" : "Password"}
              </Label>
              <Input
                id="password"
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder={editingUser ? "Biarkan kosong jika tidak diubah" : "Minimal 6 karakter"}
                required={!editingUser}
                disabled={saving}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Role / Peran</Label>
              <Select value={formRoleId} onValueChange={(val) => setFormRoleId(val || "")} disabled={saving}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Pilih Role">
                    {selectedRoleName || "Pilih Role"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status Akun</Label>
              <Select value={formStatus} onValueChange={(val) => setFormStatus(val || "aktif")} disabled={saving}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Pilih Status">
                    {selectedStatusName || "Pilih Status"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="nonaktif">Nonaktif</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog Delete User */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Pengguna</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pengguna <strong className="text-foreground">{deletingUser?.full_name}</strong> ({deletingUser?.email})? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus Pengguna"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
