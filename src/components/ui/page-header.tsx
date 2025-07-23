import React from 'react'
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  badge?: {
    label: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
    className?: string
  }
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ 
  title, 
  description, 
  icon: Icon,
  badge,
  actions,
  className 
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-4">
        {Icon && <Icon className="h-8 w-8 text-gray-600" />}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {badge && (
              <Badge variant={badge.variant} className={badge.className}>
                {badge.label}
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
} 