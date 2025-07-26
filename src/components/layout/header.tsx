'use client'

import { useState, useEffect } from 'react'
import { useUser, SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building, LayoutDashboard, HelpCircle, Shield, Users, Settings } from 'lucide-react'

interface UserRole {
  roleType: string
  organizationId?: string
}

interface UserProfile {
  firstName?: string
  lastName?: string
}

export default function Header() {
  const { user, isSignedIn } = useUser()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isSignedIn && user) {
      fetchUserRole()
      fetchUserProfile()
    }
  }, [isSignedIn, user])

  const fetchUserRole = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/role')
      if (response.ok) {
        const data = await response.json()
        setUserRole(data.role)
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.profile)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const getRoleDisplay = (roleType: string) => {
    switch (roleType) {
      case 'master':
        return { label: 'Master', color: 'bg-blue-100 text-blue-800', icon: <Building className="h-3 w-3" /> }
      case 'organization':
        return { label: 'Organization', color: 'bg-green-100 text-green-800', icon: <Users className="h-3 w-3" /> }
      case 'location':
        return { label: 'Location', color: 'bg-orange-100 text-orange-800', icon: <LayoutDashboard className="h-3 w-3" /> }
      case 'consultant':
        return { label: 'Consultant', color: 'bg-purple-100 text-purple-800', icon: <Shield className="h-3 w-3" /> }
      case 'new_user':
        return { label: 'Setup Needed', color: 'bg-yellow-100 text-yellow-800', icon: <Building className="h-3 w-3" /> }
      default:
        return { label: 'User', color: 'bg-gray-100 text-gray-800', icon: null }
    }
  }

  const getFirstName = () => {
    if (!user) return ''
    
    // First try Clerk user data
    if (user.firstName) {
      return user.firstName
    }
    
    // Then try our database profile
    if (userProfile?.firstName) {
      return userProfile.firstName
    }
    
    // Finally fall back to email parsing
    return user.emailAddresses[0]?.emailAddress.split('@')[0] || 'User'
  }

  const getHelpUrl = () => {
    if (userRole?.roleType === 'consultant') {
      return '/consultant/dashboard'
    }
    if (userRole?.roleType === 'new_user') {
      return '/complete-profile' // User needs to complete their profile
    }
    return '/consultants' // This will be the consultant marketplace page
  }

  return (
    <header className="border-b bg-white">
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <img 
              src="/fleetrax-logo.png" 
              alt="Fleetrax" 
              className="h-8 w-auto"
            />
          </Link>
          <SignedIn>
            {userRole?.roleType === 'master' && (
              <nav className="flex gap-4 text-sm">
                <Link 
                  href="/dashboard" 
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Master Overview
                </Link>
              </nav>
            )}
          </SignedIn>
        </div>
        
        <div className="flex gap-3 items-center">
          <SignedOut>
            <SignInButton>
              <Button variant="ghost" size="sm">Sign In</Button>
            </SignInButton>
          </SignedOut>
          
          <SignedIn>
            {/* Settings Button */}
            <Link href="/settings">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
            
            {/* Get Help Button */}
            <Link href={getHelpUrl()}>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Get Help
              </Button>
            </Link>
            
            {/* User Greeting and Role */}
            <div className="flex items-center gap-3">
              {!loading && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Hello, {getFirstName()}</span>
                  {userRole && (
                    <Badge 
                      variant="outline" 
                      className={`${getRoleDisplay(userRole.roleType).color} border-current`}
                    >
                      {getRoleDisplay(userRole.roleType).icon}
                      <span className="ml-1">{getRoleDisplay(userRole.roleType).label}</span>
                    </Badge>
                  )}
                </div>
              )}
              
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8"
                  }
                }}
              />
            </div>
          </SignedIn>
        </div>
      </div>
    </header>
  )
} 