import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  description?: string
  highlight?: boolean
}

export function StatsCard({ label, value, icon: Icon, description, highlight }: StatsCardProps) {
  return (
    <div className={cn(
      'card p-4',
      highlight && 'ring-1 ring-indigo-300 dark:ring-indigo-800',
    )}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className={cn(
            'mt-1 text-2xl font-bold font-mono tracking-tight',
            highlight ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-slate-100',
          )}>
            {value}
          </p>
          {description && (
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{description}</p>
          )}
        </div>
        <div className={cn(
          'p-2 rounded-lg',
          highlight ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'bg-slate-100 dark:bg-slate-800',
        )}>
          <Icon className={cn(
            'h-4 w-4',
            highlight ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400',
          )} />
        </div>
      </div>
    </div>
  )
}
