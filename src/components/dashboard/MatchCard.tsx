import { MapPin } from 'lucide-react'
import { formatDateTime, getRoundLabel } from '@/lib/utils'
import { CountdownTimer } from './CountdownTimer'
import { PredictionForm } from './PredictionForm'
import type { Match, Prediction } from '@/types'

interface MatchCardProps {
  match: Match
  prediction?: Prediction | null
  showPredictionForm?: boolean
}

const statusStyles: Record<string, { dot: string; label: string }> = {
  scheduled: { dot: 'bg-gray-400',   label: 'Geplant' },
  live:       { dot: 'bg-green-500 animate-pulse', label: 'Live' },
  finished:   { dot: 'bg-blue-500',  label: 'Beendet' },
  locked:     { dot: 'bg-amber-500', label: 'Gesperrt' },
  cancelled:  { dot: 'bg-red-500',   label: 'Abgesagt' },
}

export function MatchCard({ match, prediction, showPredictionForm = true }: MatchCardProps) {
  const st = statusStyles[match.status] ?? statusStyles['scheduled']!
  const isFinished = match.status === 'finished' && match.home_score !== null

  return (
    <div className="card overflow-hidden">
      {/* Top bar: round + status */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#181818]">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {getRoundLabel(match.round)}
          {match.group_name && <span className="ml-1 text-gray-400">· Gruppe {match.group_name}</span>}
        </span>
        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400">
          <span className={`inline-block h-2 w-2 rounded-full ${st.dot}`} />
          {st.label}
        </span>
      </div>

      {/* Match */}
      <div className="px-5 py-5">
        <div className="flex items-center justify-between gap-4">
          {/* Home */}
          <div className="flex-1 flex flex-col items-end gap-1">
            <span className="text-3xl">{match.home_team_flag ?? '🏳️'}</span>
            <span className="font-semibold text-base text-center leading-tight text-gray-900 dark:text-gray-100">
              {match.home_team}
            </span>
          </div>

          {/* Score / VS */}
          <div className="shrink-0 text-center px-4">
            {isFinished ? (
              <div className="text-3xl font-bold font-mono text-gray-900 dark:text-gray-100 tracking-tight">
                {match.home_score} : {match.away_score}
              </div>
            ) : (
              <div className="text-xl font-bold text-gray-300 dark:text-gray-600">vs</div>
            )}
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {formatDateTime(match.match_time)}
            </div>
          </div>

          {/* Away */}
          <div className="flex-1 flex flex-col items-start gap-1">
            <span className="text-3xl">{match.away_team_flag ?? '🏳️'}</span>
            <span className="font-semibold text-base leading-tight text-gray-900 dark:text-gray-100">
              {match.away_team}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-[#2a2a2a]">
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            {match.venue && (
              <>
                <MapPin className="h-3.5 w-3.5" />
                <span>{match.venue}</span>
              </>
            )}
          </div>
          <CountdownTimer matchTime={match.match_time} />
        </div>
      </div>

      {/* Prediction */}
      {showPredictionForm && (
        <div className="px-5 py-4 border-t border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#181818]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Mein Tipp</span>
            <PredictionForm match={match} existing={prediction} />
          </div>
        </div>
      )}
    </div>
  )
}
