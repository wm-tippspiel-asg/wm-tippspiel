import { cn } from '@/lib/utils'
import { Medal, Crown } from 'lucide-react'
import type { LeaderboardEntry } from '@/types'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUserId: string
}

const rankColors = [
  'text-amber-500',
  'text-slate-400',
  'text-amber-700',
]

export function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
        Noch keine Punkte vergeben. Tipp auf Spiele und schaue zurück wenn die Ergebnisse feststehen!
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 dark:text-slate-400 w-12">#</th>
            <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">Spieler</th>
            <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:table-cell">Exakt</th>
            <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500 dark:text-slate-400 hidden md:table-cell">Differenz</th>
            <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:table-cell">Gewinner</th>
            <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">Punkte</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {entries.map((entry) => {
            const isMe = entry.user_id === currentUserId
            const rankIdx = (entry.rank ?? 99) - 1

            return (
              <tr
                key={entry.user_id}
                className={cn(
                  'transition-colors',
                  isMe
                    ? 'bg-indigo-50 dark:bg-indigo-950/30'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/30',
                )}
              >
                <td className="py-3 px-3 font-mono">
                  {rankIdx < 3 ? (
                    <span className={cn('font-bold text-base', rankColors[rankIdx])}>
                      {rankIdx === 0 ? <Crown className="h-4 w-4 inline" /> : <Medal className="h-4 w-4 inline" />}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 text-xs">{entry.rank}</span>
                  )}
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('font-medium', isMe && 'text-indigo-700 dark:text-indigo-300')}>
                      {entry.username}
                    </span>
                    {isMe && (
                      <span className="badge-purple text-[10px] px-1.5 py-px badge">Du</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                  {entry.exact_results}
                </td>
                <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400 hidden md:table-cell">
                  {entry.correct_diff}
                </td>
                <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                  {entry.correct_winner}
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
                    {entry.total_points}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
