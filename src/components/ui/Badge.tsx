import { cn } from '@/lib/utils'

type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'slate' | 'purple' | 'orange'

const variantClasses: Record<BadgeVariant, string> = {
  green: 'badge-green',
  red: 'badge-red',
  yellow: 'badge-yellow',
  blue: 'badge-blue',
  slate: 'badge-slate',
  purple: 'badge-purple',
  orange: 'badge bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400',
}

interface BadgeProps {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = 'slate', className, children }: BadgeProps) {
  return <span className={cn(variantClasses[variant], className)}>{children}</span>
}
