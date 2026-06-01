import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react'

type AlertVariant = 'error' | 'success' | 'warning' | 'info'

const config: Record<AlertVariant, { icon: React.ElementType; className: string }> = {
  error: {
    icon: XCircle,
    className: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300',
  },
  success: {
    icon: CheckCircle2,
    className: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300',
  },
  warning: {
    icon: AlertCircle,
    className: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300',
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-300',
  },
}

interface AlertProps {
  variant?: AlertVariant
  title?: string
  message: string
  className?: string
}

export function Alert({ variant = 'info', title, message, className }: AlertProps) {
  const { icon: Icon, className: variantClass } = config[variant]

  return (
    <div className={cn('flex gap-3 p-4 rounded-lg border text-sm', variantClass, className)}>
      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
      <div>
        {title && <p className="font-medium mb-0.5">{title}</p>}
        <p>{message}</p>
      </div>
    </div>
  )
}
