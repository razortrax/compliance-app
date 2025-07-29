import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/master(.*)',
  '/complete-profile(.*)',
  '/settings(.*)',
  '/consultants(.*)',
  '/consultant(.*)',
  '/api/organizations(.*)',
  '/api/user(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  // For protected routes, check if user is authenticated
  if (isProtectedRoute(req)) {
    const { userId } = await auth()
    
    if (!userId) {
      // Redirect unauthenticated users to sign-in
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', req.url)
      return NextResponse.redirect(signInUrl)
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
} 