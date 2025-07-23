"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"

export function SmartRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const userRole = searchParams.get('role')

  useEffect(() => {
    const handleSmartRouting = async () => {
      // Only handle routing for authenticated users with role parameter
      if (!user || !userRole) return

      try {
        // Check organization count
        const response = await fetch('/api/organizations/count')
        if (!response.ok) return

        const { count, hasMultipleOrganizations } = await response.json()

        // Smart routing logic based on role and organization count
        if (userRole === 'master') {
          if (hasMultipleOrganizations) {
            // Master with multiple organizations → Master Overview Dashboard
            router.push('/dashboard')
          } else if (count === 0) {
            // Master with no organizations → Stay on organizations page (will show onboarding)
            // No redirect needed - they're already on the right page
          } else {
            // Master with 1 organization → Stay on organizations page  
            // No redirect needed - they're already on the right page
          }
        } else if (userRole === 'organization') {
          // Organization managers always go to organizations page
          // No redirect needed - they're already on the right page
        }
      } catch (error) {
        console.error('Smart routing error:', error)
        // On error, stay on current page
      }
    }

    // Small delay to ensure user data is loaded
    const timer = setTimeout(handleSmartRouting, 500)
    return () => clearTimeout(timer)
  }, [user, userRole, router])

  return null // This component doesn't render anything
} 