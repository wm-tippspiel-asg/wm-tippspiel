import { cn } from '@/lib/utils'
import type { LeaderboardEntry } from '@/types'

interface Props {
  entries: LeaderboardEntry[]
  currentUserId: string
}

export function LeaderboardTable({ entries, currentUserId }: Props) {
  if (entries.length === 0) {
    return (
      <p className="py-10 text-center text-base text-gray-500 dark:text-gray-400">
        Noch keine Punkte vergeben — tippe auf Spiele und schau nach dem Abpfiff wieder rein.
      </p>
    )
  }

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-[#2a2a2a] text-sm text-gray-500 dark:text-gray-400">
            <th className="text-left px-5 py-3 font-medium w-12">#</th>
            <th className="text-left px-5 py-3 font-medium">Spieler</th>
            <th className="text-right px-5 py-3 font-medium hidden sm:table-cell">Exakt</th>
            <th className="text-right px-5 py-3 font-medium hidden md:table-cell">Differenz</th>
            <th className="text-right px-5 py-3 font-medium hidden sm:table-cell">Gewinner</th>
            <th className="text-right px-5 py-3 font-medium">Punkte</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-[#222]">
          {entries.map((e) => {
            const isMe = e.user_id === currentUserId
            const rank = e.rank ?? 99

            return (
              <tr key={e.user_id}
                className={cn(
                  'transition-colors',
                  isMe ? 'bg-green-50 dark:bg-green-950/20' : 'hover:bg-gray-50 dark:hover:bg-[#1a1a1a]',
                )}>
                <td className="px-5 py-4 text-base">
                  {rank <= 3
                    ? <span className="text-xl">{medals[rank - 1]}</span>
                    : <span className="font-mono text-gray-400 text-sm">{rank}</span>
                  }
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className={cn('font-semibold text-base', isMe && 'text-green-700 dark:text-green-400')}>
                      {e.username}
                    </span>
                    {isMe && <span className="badge-green text-xs">Du</span>}
                  </div>
                </td>
                <td className="px-5 py-4 text-right text-base text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                  {e.exact_results}
                </td>
                <td className="px-5 py-4 text-right text-base text-gray-600 dark:text-gray-400 hidden md:table-cell">
                  {e.correct_diff}
                </td>
                <td className="px-5 py-4 text-right text-base text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                  {e.correct_winner}
                </td>
                <td className="px-5 py-4 text-right">
                  <span className={cn(
                    'text-xl font-bold font-mono',
                    rank === 1 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100',
                  )}>
                    {e.total_points}
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
