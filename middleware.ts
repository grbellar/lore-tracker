export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints)
     * - auth/signin (sign-in page)
     * - auth/signup (sign-up page)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|auth/signin|auth/signup|_next/static|_next/image|favicon.ico).*)",
  ],
}
