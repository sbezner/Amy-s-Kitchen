export const ALLOWED_DOMAINS = ['energizedengines.com', 'gmail.com'] as const

// Emails that should always be admins, even if their user doc gets
// recreated (e.g. account-linking didn't link a new sign-in method to
// their existing UID). Keep this list short and only add people you'd
// trust to approve other users.
export const ADMIN_EMAILS = ['sbezner@gmail.com', 'abezner@gmail.com'] as const

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  return (ALLOWED_DOMAINS as readonly string[]).includes(domain)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return (ADMIN_EMAILS as readonly string[]).includes(email.toLowerCase())
}

export const ALLOWED_DOMAINS_LABEL = ALLOWED_DOMAINS.map((d) => `@${d}`).join(' or ')
