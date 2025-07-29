'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    // Fetch user's master organization and redirect
    const redirectToMaster = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const { masterOrganization } = await response.json()
          if (masterOrganization?.id) {
            router.replace(`/master/${masterOrganization.id}`)
          } else {
            router.replace('/complete-profile')
          }
        } else {
          router.replace('/complete-profile')
        }
      } catch (error) {
        console.error('Error redirecting to master:', error)
        router.replace('/complete-profile')
      }
    }
    
    redirectToMaster()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Redirecting...</h2>
        <p className="text-gray-600">Taking you to your dashboard</p>
      </div>
    </div>
  )
} 