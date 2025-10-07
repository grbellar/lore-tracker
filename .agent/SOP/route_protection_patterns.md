# Route Protection Patterns

**Related docs:**
- [Authentication System](../System/authentication_system.md)
- [Project Architecture](../System/project_architecture.md)

## Overview

This document outlines standard operating procedures for protecting routes and accessing user sessions in the Lore Tracker application. The authentication system uses NextAuth.js v4 with JWT sessions.

## Table of Contents

1. [Automatic Route Protection (Middleware)](#automatic-route-protection-middleware)
2. [Server Component Authentication](#server-component-authentication)
3. [Client Component Authentication](#client-component-authentication)
4. [API Route Protection](#api-route-protection)
5. [Server Action Protection](#server-action-protection)
6. [Common Patterns](#common-patterns)
7. [Troubleshooting](#troubleshooting)

## Automatic Route Protection (Middleware)

### How It Works

The application uses Next.js middleware to automatically protect all routes except authentication pages and public assets.

**Location:** `middleware.ts`

```typescript
export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/((?!api/auth|auth/signin|auth/signup|_next/static|_next/image|favicon.ico).*)",
  ],
}
```

### Protected Routes

All routes are protected **except**:
- `/api/auth/*` - NextAuth endpoints
- `/auth/signin` - Sign in page
- `/auth/signup` - Sign up page
- `/_next/static/*` - Static assets
- `/_next/image/*` - Image optimization
- `/favicon.ico` - Favicon

### Behavior

- Unauthenticated users are automatically redirected to `/auth/signin`
- Session is checked on every request
- JWT token is verified automatically
- No additional code needed for basic protection

### Adding Public Routes

To make a route public, update the matcher regex in `middleware.ts`:

```typescript
export const config = {
  matcher: [
    "/((?!api/auth|auth/signin|auth/signup|public-page|_next/static|_next/image|favicon.ico).*)",
  ],
}
```

## Server Component Authentication

### Basic Usage

Server components can access the session using `getServerSession()`.

```typescript
import { getServerSession } from "next-auth/next"

export default async function DashboardPage() {
  const session = await getServerSession()

  if (!session) {
    // This shouldn't happen due to middleware, but good practice
    redirect('/auth/signin')
  }

  return (
    <div>
      <h1>Welcome {session.user.name}</h1>
      <p>Email: {session.user.email}</p>
      <p>User ID: {session.user.id}</p>
    </div>
  )
}
```

### With AuthOptions

For more control, pass your NextAuth options:

```typescript
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export default async function Page() {
  const session = await getServerSession(authOptions)

  // Use session...
}
```

**Note:** You'll need to export `authOptions` from your NextAuth configuration for this pattern.

### Accessing User Data

```typescript
const session = await getServerSession()

// User properties available:
session.user.id      // string - User ID
session.user.name    // string | null - User name
session.user.email   // string | null - User email
session.user.image   // string | null - User image URL
```

## Client Component Authentication

### Basic Usage

Client components use the `useSession()` hook.

```typescript
'use client'

import { useSession } from "next-auth/react"

export default function ProfileComponent() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (status === "unauthenticated") {
    return <div>Not signed in</div>
  }

  return (
    <div>
      <h2>Hello {session.user.name}</h2>
      <p>ID: {session.user.id}</p>
    </div>
  )
}
```

### Session Status

The `status` can be:
- `"loading"` - Session is being fetched
- `"authenticated"` - User is signed in
- `"unauthenticated"` - User is not signed in

### Required Pattern

```typescript
'use client'

import { useSession } from "next-auth/react"

export default function Component() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      // Redirect to sign in or show message
      window.location.href = '/auth/signin'
    },
  })

  // Component code...
}
```

### Sign Out

```typescript
'use client'

import { signOut } from "next-auth/react"

export default function SignOutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: '/auth/signin' })}>
      Sign Out
    </button>
  )
}
```

## API Route Protection

### Manual Protection

API routes require manual session checking.

```typescript
import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const session = await getServerSession()

  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  // Protected logic here
  const userId = session.user.id

  return NextResponse.json({ data: "protected data" })
}
```

### POST Request Example

```typescript
import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await getServerSession()

  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const body = await request.json()

  // Use session.user.id for database operations
  const result = await prisma.someModel.create({
    data: {
      ...body,
      userId: session.user.id,
    },
  })

  return NextResponse.json(result)
}
```

### Reusable Protection Helper

Create a helper function for API route protection:

**Location:** `lib/api-auth.ts`

```typescript
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"

export async function requireAuth(): Promise<Session> {
  const session = await getServerSession()

  if (!session) {
    throw new Error("Unauthorized")
  }

  return session
}
```

**Usage:**

```typescript
import { requireAuth } from "@/lib/api-auth"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const session = await requireAuth()

    // Use session.user.id
    return NextResponse.json({ userId: session.user.id })
  } catch (error) {
    return new Response("Unauthorized", { status: 401 })
  }
}
```

## Server Action Protection

### Protecting Server Actions

Server actions also need manual session checking.

```typescript
'use server'

import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createItem(formData: FormData) {
  const session = await getServerSession()

  if (!session) {
    throw new Error("Unauthorized")
  }

  const name = formData.get("name") as string

  const item = await prisma.item.create({
    data: {
      name,
      userId: session.user.id,
    },
  })

  revalidatePath('/dashboard')
  return item
}
```

### With Type Safety

```typescript
'use server'

import { getServerSession } from "next-auth/next"

type ActionResult =
  | { success: true; data: any }
  | { success: false; error: string }

export async function protectedAction(data: any): Promise<ActionResult> {
  const session = await getServerSession()

  if (!session) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Protected logic
    return { success: true, data: {} }
  } catch (error) {
    return { success: false, error: "Something went wrong" }
  }
}
```

## Common Patterns

### Pattern 1: Owner-Only Access

Ensure users can only access their own data.

```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()

  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const item = await prisma.item.findUnique({
    where: { id: params.id },
  })

  if (!item) {
    return new Response("Not found", { status: 404 })
  }

  // Check ownership
  if (item.userId !== session.user.id) {
    return new Response("Forbidden", { status: 403 })
  }

  return NextResponse.json(item)
}
```

### Pattern 2: Conditional Rendering

Show different content based on auth status.

```typescript
'use client'

import { useSession } from "next-auth/react"
import Link from "next/link"

export default function Navigation() {
  const { data: session, status } = useSession()

  return (
    <nav>
      {status === "authenticated" ? (
        <>
          <Link href="/dashboard">Dashboard</Link>
          <span>Welcome, {session.user.name}</span>
        </>
      ) : (
        <>
          <Link href="/auth/signin">Sign In</Link>
          <Link href="/auth/signup">Sign Up</Link>
        </>
      )}
    </nav>
  )
}
```

### Pattern 3: Loading States

Handle loading gracefully.

```typescript
'use client'

import { useSession } from "next-auth/react"

export default function Component() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    )
  }

  if (!session) {
    return null // Middleware will redirect
  }

  return <div>Content</div>
}
```

### Pattern 4: Prefetching User Data

Load user-specific data in server components.

```typescript
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/auth/signin')
  }

  // Fetch user's data
  const userData = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      // Include related data
      items: true,
    },
  })

  return <Dashboard user={userData} />
}
```

## Troubleshooting

### Issue: Session is null in server component

**Causes:**
- Middleware not configured correctly
- Session expired
- JWT verification failed

**Solutions:**
1. Check middleware.ts is properly configured
2. Verify NEXTAUTH_SECRET is set
3. Clear cookies and sign in again
4. Check server logs for errors

### Issue: useSession() returns unauthenticated in client component

**Causes:**
- SessionProvider not wrapping the app
- Session expired

**Solutions:**
1. Verify `app/layout.tsx` wraps children with `<SessionProvider>`
2. Check browser cookies (should have `next-auth.session-token`)
3. Sign out and sign in again

### Issue: Infinite redirect loop

**Causes:**
- Middleware protecting sign-in page
- Custom redirects conflicting

**Solutions:**
1. Verify middleware matcher excludes `/auth/signin` and `/auth/signup`
2. Check for custom redirect logic in pages

### Issue: Type errors on session.user.id

**Causes:**
- TypeScript types not extended

**Solutions:**
1. Verify `types/next-auth.d.ts` exists
2. Restart TypeScript server
3. Check that types extend User, Session, and JWT interfaces

### Issue: API route returns 401 even when signed in

**Causes:**
- Not using getServerSession correctly
- Different authOptions configuration

**Solutions:**
1. Ensure you're importing from "next-auth/next"
2. Use the same authOptions as your [...nextauth] route
3. Check that cookies are being sent with API requests

## Best Practices

### ✅ Do

- Always check session in API routes
- Use middleware for automatic page protection
- Handle loading states in client components
- Validate ownership before modifying data
- Use TypeScript types for type safety
- Clear error messages for auth failures

### ❌ Don't

- Don't trust client-side auth checks for security
- Don't expose sensitive data without server-side checks
- Don't forget to handle loading and error states
- Don't hard-code user IDs
- Don't skip session validation in server actions

## Security Checklist

When implementing protected routes:

- [ ] Server-side session validation implemented
- [ ] Ownership checks for user-specific data
- [ ] Proper error handling (don't leak info in errors)
- [ ] Input validation on all data
- [ ] Rate limiting on sensitive endpoints (future)
- [ ] Audit logging for sensitive actions (future)
- [ ] HTTPS in production

## Quick Reference

```typescript
// Server Component
import { getServerSession } from "next-auth/next"
const session = await getServerSession()

// Client Component
'use client'
import { useSession } from "next-auth/react"
const { data: session, status } = useSession()

// API Route
import { getServerSession } from "next-auth/next"
const session = await getServerSession()
if (!session) return new Response("Unauthorized", { status: 401 })

// Sign Out
'use client'
import { signOut } from "next-auth/react"
signOut({ callbackUrl: '/auth/signin' })
```

---

**Last Updated:** 2025-10-07
**Maintained By:** Development Team
**Related:** Authentication System, Database Schema
