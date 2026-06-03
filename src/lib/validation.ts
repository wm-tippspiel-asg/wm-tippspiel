import { z } from 'zod'

export const usernameSchema = z
  .string()
  .min(3, 'Mindestens 3 Zeichen')
  .max(20, 'Maximal 20 Zeichen')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Nur Buchstaben, Zahlen, _ und - erlaubt')

export const passwordSchema = z
  .string()
  .min(8, 'Mindestens 8 Zeichen erforderlich')
  .max(128, 'Maximal 128 Zeichen')
  .regex(/[A-Z]/, 'Mindestens ein Großbuchstabe erforderlich')
  .regex(/[a-z]/, 'Mindestens ein Kleinbuchstabe erforderlich')
  .regex(/[0-9]/, 'Mindestens eine Zahl erforderlich')
  .regex(/[^A-Za-z0-9]/, 'Mindestens ein Sonderzeichen erforderlich')

export const registrationCodeSchema = z
  .string()
  .min(4, 'Ungültiger Code')
  .max(32, 'Ungültiger Code')
  .regex(/^[A-Z0-9-]+$/i, 'Ungültiges Code-Format')

export const loginSchema = z.object({
  username: z.string().min(1, 'Benutzername erforderlich').max(100),
  password: z.string().min(1, 'Passwort erforderlich').max(128),
  turnstileToken: z.string().optional(),
})

export const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  code: registrationCodeSchema,
  turnstileToken: z.string().optional(),
})

export const predictionSchema = z.object({
  match_id: z.string().min(1),
  home_score: z.number().int().min(0).max(99),
  away_score: z.number().int().min(0).max(99),
})

export const matchSchema = z.object({
  home_team: z.string().min(1).max(100),
  away_team: z.string().min(1).max(100),
  home_team_flag: z.string().max(10).optional().nullable(),
  away_team_flag: z.string().max(10).optional().nullable(),
  match_time: z.string().datetime({ message: 'Ungültiges Datum' }),
  round: z.enum(['group', 'round_of_16', 'round_of_8', 'quarter_final', 'semi_final', 'final']),
  group_name: z.string().max(5).optional().nullable(),
  venue: z.string().max(200).optional().nullable(),
})

export const matchResultSchema = z.object({
  home_score: z.number().int().min(0).max(99),
  away_score: z.number().int().min(0).max(99),
})

export const codeCreateSchema = z.object({
  description: z.string().max(200).optional(),
  max_uses: z.number().int().min(1).max(1000).optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
})

export const profileUpdateSchema = z.object({
  username: usernameSchema,
})

export const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1, 'Aktuelles Passwort erforderlich'),
    new_password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwörter stimmen nicht überein',
    path: ['confirm_password'],
  })

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export function getIpAddress(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}
