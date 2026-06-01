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
    <div className={cn('card p-5', highlight && 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
          <p className={cn(
            'mt-1.5 text-3xl font-bold font-mono tracking-tight',
            highlight ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-gray-100',
          )}>
            {value}
          </p>
          {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
        </div>
        <div className={cn('p-2.5 rounded-xl', highlight ? 'bg-green-100 dark:bg-green-900/40' : 'bg-gray-100 dark:bg-[#2a2a2a]')}>
          <Icon className={cn('h-5 w-5', highlight ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400')} />
        </div>
      </div>
    </div>
  )
}
