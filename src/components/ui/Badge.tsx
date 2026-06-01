import { cn } from '@/lib/utils'

type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'slate' | 'purple' | 'orange'

const map: Record<BadgeVariant, string> = {
  green:  'badge-green',
  red:    'badge-red',
  yellow: 'badge-yellow',
  blue:   'badge-blue',
  slate:  'badge-slate',
  purple: 'badge-purple',
  orange: 'badge bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400',
}

export function Badge({ variant = 'slate', className, children }: {
  variant?: BadgeVariant; className?: string; children: React.ReactNode
}) {
  return <span className={cn(map[variant], className)}>{children}</span>
}
