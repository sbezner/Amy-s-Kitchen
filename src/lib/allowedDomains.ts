export const ALLOWED_DOMAINS = ['energizedengines.com', 'gmail.com'] as const

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  return (ALLOWED_DOMAINS as readonly string[]).includes(domain)
}

export const ALLOWED_DOMAINS_LABEL = ALLOWED_DOMAINS.map((d) => `@${d}`).join(' or ')
