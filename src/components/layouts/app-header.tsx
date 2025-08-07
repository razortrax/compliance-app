"use client"

import { useUser, UserButton } from '@clerk/nextjs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building, Users, MapPin, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { setUserContext } from '@/lib/sentry-utils'

interface TopNavItem {
  label: string
  href: string
  isActive?: boolean
}

interface AppHeaderProps {
  name?: string
  topNav?: TopNavItem[]
}

interface UserRole {
  roleType: string
  organizationId?: string
}

export function AppHeader({ name, topNav = [] }: AppHeaderProps) {
  const { user } = useUser()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchUserRole()
      fetchUserName()
      try {
        const email = user?.emailAddresses?.[0]?.emailAddress
        setUserContext({ id: user.id, email })
      } catch {}
    }
  }, [user])

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/user/role')
      if (response.ok) {
        const data = await response.json()
        setUserRole(data.role)
        if (data?.role?.roleType) {
          Sentry.setTag('role', data.role.roleType)
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const fetchUserName = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        if (data.person) {
          setUserName(data.person.firstName)
        }
      }
    } catch (error) {
      console.error('Error fetching user name:', error)
    }
  }

  const getRoleDisplay = (roleType: string) => {
    switch (roleType) {
      case 'master':
        return {
          label: 'MASTER',
          icon: <Building className="h-3 w-3" />,
          color: 'bg-blue-100 text-blue-700 border-blue-200'
        }
      case 'organization':
        return {
          label: 'ORGANIZATION',
          icon: <Users className="h-3 w-3" />,
          color: 'bg-green-100 text-green-700 border-green-200'
        }
      case 'location':
        return {
          label: 'LOCATION',
          icon: <MapPin className="h-3 w-3" />,
          color: 'bg-orange-100 text-orange-700 border-orange-200'
        }
      default:
        return {
          label: 'USER',
          icon: <Users className="h-3 w-3" />,
          color: 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }
  }

  const getFirstName = () => {
    // Use database name first, then fall back to Clerk data
    if (userName) return userName
    
    // Try different name sources from Clerk user object
    if (user?.firstName) return user.firstName
    if (user?.fullName) return user.fullName.split(' ')[0]  
    if (user?.username) return user.username
    if (user?.emailAddresses?.[0]?.emailAddress) {
      return user.emailAddresses[0].emailAddress.split('@')[0]
    }
    return 'User'
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side: Logo + Name + TopNav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <Image
              src="/fleetrax-logo.png"
              alt="Fleetrax"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>
          {name && (
            <div className="flex items-center gap-2 text-lg font-medium text-gray-700">
              <span className="text-gray-400">|</span>
              <span>{name}</span>
            </div>
          )}
          
          {/* Top Navigation */}
          {topNav.length > 0 && (
            <nav className="flex items-center space-x-4">
              {topNav.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.isActive
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        
        {/* Right side: Greeting + Account */}
        <div className="flex items-center space-x-4">
          {/* Greeting + Role Badge */}
          {user && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                Hello {getFirstName()}
              </span>
              {userRole && (
                <Badge 
                  variant="outline" 
                  className={`${getRoleDisplay(userRole.roleType).color} border-current flex items-center gap-1`}
                >
                  {getRoleDisplay(userRole.roleType).icon}
                  <span>{getRoleDisplay(userRole.roleType).label}</span>
                </Badge>
              )}
            </div>
          )}
          
          {/* Get Help Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Placeholder for future implementation
              alert('Get Help feature coming soon! This will connect you with a compliance consultant.')
            }}
            className="flex items-center gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            Get Help
          </Button>
          
          {/* Account (Clerk UserButton) */}
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "h-8 w-8"
              }
            }}
          />
        </div>
      </div>
    </header>
  )
} 