import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"

/**
 * Require authentication for API routes and server actions.
 * Throws an error if the user is not authenticated.
 *
 * @returns The authenticated session
 * @throws Error if user is not authenticated
 *
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   try {
 *     const session = await requireAuth()
 *     // Use session.user.id
 *     return NextResponse.json({ userId: session.user.id })
 *   } catch (error) {
 *     return new Response("Unauthorized", { status: 401 })
 *   }
 * }
 * ```
 */
export async function requireAuth(): Promise<Session> {
  const session = await getServerSession()

  if (!session) {
    throw new Error("Unauthorized")
  }

  return session
}
