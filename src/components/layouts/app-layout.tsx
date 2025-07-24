"use client"

import { ReactNode } from 'react'
import { useUser } from '@clerk/nextjs'
import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'

interface AppLayoutProps {
  children: ReactNode
  // Header configuration
  name?: string
  topNav?: Array<{
    label: string
    href: string
    isActive?: boolean
  }>
  // Sidebar configuration  
  showOrgSelector?: boolean
  showDriverEquipmentSelector?: boolean
  sidebarMenu?: 'organization' | 'driver' | 'equipment'
  // Content configuration
  className?: string
}

export function AppLayout({
  children,
  name,
  topNav = [],
  showOrgSelector = false,
  showDriverEquipmentSelector = false,
  sidebarMenu,
  className = ""
}: AppLayoutProps) {
  const { user } = useUser()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader 
        name={name}
        topNav={topNav}
      />
      
      <div className="flex">
        {/* Sidebar - only show if we have selectors or menu */}
        {(showOrgSelector || showDriverEquipmentSelector || sidebarMenu) && (
          <AppSidebar
            showOrgSelector={showOrgSelector}
            showDriverEquipmentSelector={showDriverEquipmentSelector}
            menuType={sidebarMenu}
          />
        )}
        
        {/* Main Content */}
        <main className={`flex-1 ${className}`}>
          {children}
        </main>
      </div>
    </div>
  )
} 