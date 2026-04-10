export function isAdmin(email: string | undefined): boolean {
  return !!email && email === process.env.NEXT_PUBLIC_ADMIN_EMAIL
}
