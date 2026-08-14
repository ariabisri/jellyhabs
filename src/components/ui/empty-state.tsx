import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Inbox } from "lucide-react"

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title?: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title = "Belum ada data",
  description = "Data akan muncul di sini setelah ditambahkan.",
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 mb-4">
        <Icon className="h-7 w-7 text-muted-foreground/50" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      {actionLabel && (
        <div className="mt-4">
          {actionHref ? (
            <a href={actionHref}>
              <Button size="sm">{actionLabel}</Button>
            </a>
          ) : (
            <Button size="sm" onClick={onAction}>{actionLabel}</Button>
          )}
        </div>
      )}
    </div>
  )
}
