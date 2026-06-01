import { CalendarDays, MapPin } from 'lucide-react'
import { formatDateTime, getRoundLabel } from '@/lib/utils'
import { CountdownTimer } from './CountdownTimer'
import { PredictionForm } from './PredictionForm'
import { Badge } from '@/components/ui/Badge'
import type { Match, Prediction } from '@/types'

interface MatchCardProps {
  match: Match
  prediction?: Prediction | null
  showPredictionForm?: boolean
}

const statusBadge: Record<string, { variant: 'green' | 'yellow' | 'slate' | 'red' | 'blue'; label: string }> = {
  scheduled: { variant: 'slate', label: 'Geplant' },
  live: { variant: 'green', label: 'Live' },
  finished: { variant: 'blue', label: 'Beendet' },
  locked: { variant: 'yellow', label: 'Gesperrt' },
  cancelled: { variant: 'red', label: 'Abgesagt' },
}

export function MatchCard({ match, prediction, showPredictionForm = true }: MatchCardProps) {
  const badge = statusBadge[match.status] ?? statusBadge['scheduled']!

  return (
    <div className="card hover:shadow-card-hover transition-shadow">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {getRoundLabel(match.round)}
            {match.group_name && ` · Gruppe ${match.group_name}`}
          </span>
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      {/* Match info */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Home team */}
          <div className="flex-1 text-right">
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
              {match.home_team_flag && <span className="mr-1.5">{match.home_team_flag}</span>}
              {match.home_team}
            </div>
          </div>

          {/* Score / vs */}
          <div className="shrink-0 text-center min-w-[4rem]">
            {match.status === 'finished' && match.home_score !== null ? (
              <div className="font-bold text-xl text-slate-900 dark:text-slate-100 font-mono">
                {match.home_score} : {match.away_score}
              </div>
            ) : (
              <div className="text-slate-400 dark:text-slate-500 font-semibold">vs</div>
            )}
          </div>

          {/* Away team */}
          <div className="flex-1 text-left">
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
              {match.away_team_flag && <span className="mr-1.5">{match.away_team_flag}</span>}
              {match.away_team}
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDateTime(match.match_time)}
            </span>
            {match.venue && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {match.venue}
              </span>
            )}
          </div>
          <CountdownTimer matchTime={match.match_time} />
        </div>
      </div>

      {/* Prediction form */}
      {showPredictionForm && (
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 rounded-b-xl">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Mein Tipp:
            </span>
            <PredictionForm match={match} existing={prediction} />
          </div>
        </div>
      )}
    </div>
  )
}
