import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Trophy, Star, Target, Zap, Shield, BookOpen } from 'lucide-react'
import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = { title: 'Über das Spiel' }

export default function AboutPage() {
  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Über das Spiel</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Alles, was du über das WM-Tippspiel wissen musst.
        </p>
      </div>

      {/* Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-500" />
            <h2 className="section-title">Regeln</h2>
          </div>
        </CardHeader>
        <CardBody className="prose prose-sm dark:prose-invert max-w-none">
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <li className="flex gap-2">
              <span className="mt-0.5 text-slate-400">•</span>
              Jeder Teilnehmer kann für jedes Spiel einen Tipp abgeben.
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-slate-400">•</span>
              Tipps können bis zum Anpfiff des Spiels geändert werden.
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-slate-400">•</span>
              Nach Spielbeginn sind keine Änderungen mehr möglich.
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-slate-400">•</span>
              Punkte werden automatisch nach Spielende berechnet.
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-slate-400">•</span>
              Bei Punktegleichstand zählen mehr exakte Treffer.
            </li>
          </ul>
        </CardBody>
      </Card>

      {/* Scoring */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h2 className="section-title">Punktesystem</h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                  <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="font-medium text-sm text-emerald-800 dark:text-emerald-300">Exaktes Ergebnis</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-500">z.B. 2:1 getippt, 2:1 gespielt</div>
                </div>
              </div>
              <span className="font-bold text-lg text-emerald-700 dark:text-emerald-300">+5</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <Star className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-sm text-blue-800 dark:text-blue-300">Richtige Differenz + Gewinner</div>
                  <div className="text-xs text-blue-600 dark:text-blue-500">z.B. 3:1 getippt, 2:0 gespielt (beide +1)</div>
                </div>
              </div>
              <span className="font-bold text-lg text-blue-700 dark:text-blue-300">+3</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <Target className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <div className="font-medium text-sm text-slate-700 dark:text-slate-300">Richtiger Gewinner / Unentschieden</div>
                  <div className="text-xs text-slate-500">z.B. Sieg getippt, Sieg erspielt</div>
                </div>
              </div>
              <span className="font-bold text-lg text-slate-700 dark:text-slate-300">+2</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Shield className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <div className="font-medium text-sm text-red-700 dark:text-red-400">Falscher Tipp</div>
                  <div className="text-xs text-red-500">Kein Punkt für falsche Ergebnisse</div>
                </div>
              </div>
              <span className="font-bold text-lg text-red-600">0</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Privacy & Impressum */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-500" />
            <h2 className="section-title">Datenschutz & Impressum</h2>
          </div>
        </CardHeader>
        <CardBody className="text-sm text-slate-600 dark:text-slate-400 space-y-3">
          <p>
            Diese Anwendung ist ausschließlich für den internen Schulgebrauch bestimmt.
            Es werden nur die für den Spielbetrieb notwendigen Daten (Benutzername, Passwort-Hash)
            gespeichert.
          </p>
          <p>
            Es werden keine Daten an Dritte weitergegeben. Alle Daten werden sicher
            und verschlüsselt gespeichert.
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-xs">
            Impressum: [Hier Schulname und Kontakt eintragen] — Version 1.0
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
