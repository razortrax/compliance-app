'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { FileText, Image, Video, FileIcon, Search, Filter, Plus, Eye, Download } from 'lucide-react'

export interface AddonDisplayItem {
  id: string
  attachmentType: string // note, document, image, video, etc.
  fileName?: string
  description?: string
  noteContent?: string
  url?: string
  fileType?: string
  fileSize?: number
  createdAt: string
  updatedAt?: string
  tags?: string[]
  status?: string
}

export interface AddonDisplayConfig {
  showSearch?: boolean
  showTypeFilter?: boolean
  showStatusFilter?: boolean
  showTagFilter?: boolean
  allowCreate?: boolean
  allowView?: boolean
  allowDownload?: boolean
  allowEdit?: boolean
  allowDelete?: boolean
  createButtonText?: string
  emptyStateText?: string
  displayMode?: 'list' | 'grid' | 'compact'
}

export interface UnifiedAddonDisplayProps {
  items: AddonDisplayItem[]
  availableTypes: { value: string; label: string; icon?: React.ComponentType<{ className?: string }> }[]
  config?: AddonDisplayConfig
  onCreateClick?: () => void
  onViewClick?: (item: AddonDisplayItem) => void
  onEditClick?: (item: AddonDisplayItem) => void
  onDeleteClick?: (item: AddonDisplayItem) => void
  onDownloadClick?: (item: AddonDisplayItem) => void
  className?: string
}

const DEFAULT_CONFIG: AddonDisplayConfig = {
  showSearch: true,
  showTypeFilter: true,
  showStatusFilter: false,
  showTagFilter: false,
  allowCreate: true,
  allowView: true,
  allowDownload: true,
  allowEdit: false,
  allowDelete: false,
  createButtonText: 'Add Addon',
  emptyStateText: 'No addons yet',
  displayMode: 'list'
}

export function UnifiedAddonDisplay({
  items,
  availableTypes,
  config = {},
  onCreateClick,
  onViewClick,
  onEditClick,
  onDeleteClick,
  onDownloadClick,
  className = ''
}: UnifiedAddonDisplayProps) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Get unique tags from items
  const allTags = useMemo(() => {
    const tags = items.flatMap(item => item.tags || [])
    return Array.from(new Set(tags)).sort()
  }, [items])

  // Get unique statuses from items
  const allStatuses = useMemo(() => {
    const statuses = items.map(item => item.status).filter(Boolean) as string[]
    return Array.from(new Set(statuses)).sort()
  }, [items])

  // Filter items based on current filters
  const filteredItems = useMemo(() => {
    let filtered = items

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(item =>
        item.fileName?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search) ||
        item.noteContent?.toLowerCase().includes(search) ||
        item.tags?.some(tag => tag.toLowerCase().includes(search))
      )
    }

    // Type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(item => selectedTypes.includes(item.attachmentType))
    }

    // Status filter
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(item => item.status && selectedStatuses.includes(item.status))
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(item =>
        selectedTags.some(tag => item.tags?.includes(tag))
      )
    }

    return filtered
  }, [items, searchTerm, selectedTypes, selectedStatuses, selectedTags])

  // Toggle filter functions
  const toggleTypeFilter = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const toggleStatusFilter = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
  }

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  // Get icon for attachment type
  const getTypeIcon = (item: AddonDisplayItem) => {
    if (item.attachmentType === 'note' || item.noteContent) {
      return <FileText className="h-5 w-5 text-blue-600" />
    }
    if (item.fileType?.startsWith('image/')) {
      return <Image className="h-5 w-5 text-green-600" />
    }
    if (item.fileType?.startsWith('video/')) {
      return <Video className="h-5 w-5 text-purple-600" />
    }
    return <FileIcon className="h-5 w-5 text-gray-600" />
  }

  // Get background color for type
  const getTypeBackground = (item: AddonDisplayItem) => {
    if (item.attachmentType === 'note' || item.noteContent) return 'bg-blue-100'
    if (item.fileType?.startsWith('image/')) return 'bg-green-100'
    if (item.fileType?.startsWith('video/')) return 'bg-purple-100'
    return 'bg-gray-100'
  }

  // Get display label for attachment type
  const getTypeLabel = (item: AddonDisplayItem) => {
    const typeConfig = availableTypes.find(t => t.value === item.attachmentType)
    if (typeConfig) return typeConfig.label
    
    if (item.attachmentType === 'note') return 'Note'
    if (item.noteContent && item.url) return 'File + Note'
    if (item.url) return 'File'
    return 'Unknown'
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedTypes([])
    setSelectedStatuses([])
    setSelectedTags([])
  }

  const hasActiveFilters = searchTerm || selectedTypes.length > 0 || selectedStatuses.length > 0 || selectedTags.length > 0

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with search, filters, and create button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          {/* Search */}
          {finalConfig.showSearch && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search addons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {/* Filters */}
          {(finalConfig.showTypeFilter || finalConfig.showStatusFilter || finalConfig.showTagFilter) && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                      {(selectedTypes.length + selectedStatuses.length + selectedTags.length)}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  {/* Type Filter */}
                  {finalConfig.showTypeFilter && availableTypes.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Type</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {availableTypes.map(type => (
                          <Badge
                            key={type.value}
                            variant={selectedTypes.includes(type.value) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleTypeFilter(type.value)}
                          >
                            {type.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status Filter */}
                  {finalConfig.showStatusFilter && allStatuses.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {allStatuses.map(status => (
                          <Badge
                            key={status}
                            variant={selectedStatuses.includes(status) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleStatusFilter(status)}
                          >
                            {status}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tag Filter */}
                  {finalConfig.showTagFilter && allTags.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {allTags.map(tag => (
                          <Badge
                            key={tag}
                            variant={selectedTags.includes(tag) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleTagFilter(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Create Button */}
        {finalConfig.allowCreate && onCreateClick && (
          <Button onClick={onCreateClick} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {finalConfig.createButtonText}
          </Button>
        )}
      </div>

      {/* Items Display */}
      {filteredItems.length > 0 ? (
        <div className={`space-y-2 ${finalConfig.displayMode === 'grid' ? 'grid grid-cols-2 gap-4 space-y-0' : ''}`}>
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                finalConfig.displayMode === 'compact' ? 'bg-gray-50 py-2' : 'bg-white hover:shadow-sm transition-shadow'
              }`}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {item.fileType?.startsWith('image/') && item.url ? (
                  <div className="w-10 h-10 rounded border overflow-hidden">
                    <img 
                      src={item.url} 
                      alt={item.fileName || 'Image'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ) : (
                  <div className={`w-10 h-10 rounded flex items-center justify-center ${getTypeBackground(item)}`}>
                    {getTypeIcon(item)}
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.fileName || 'Untitled'}
                </p>
                {item.description && (
                  <p className="text-xs text-gray-600 truncate">{item.description}</p>
                )}
                {item.noteContent && (
                  <p className="text-xs text-gray-600 truncate italic">
                    "{item.noteContent.substring(0, 50)}..."
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(item)}
                  </Badge>
                  {item.status && (
                    <Badge variant="secondary" className="text-xs">
                      {item.status}
                    </Badge>
                  )}
                  {item.tags?.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  <span className="text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {finalConfig.allowView && onViewClick && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onViewClick(item)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                
                {finalConfig.allowDownload && onDownloadClick && item.url && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onDownloadClick(item)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                
                {finalConfig.allowEdit && onEditClick && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onEditClick(item)}
                  >
                    Edit
                  </Button>
                )}
                
                {finalConfig.allowDelete && onDeleteClick && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onDeleteClick(item)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>{hasActiveFilters ? 'No addons match your filters' : finalConfig.emptyStateText}</p>
          {hasActiveFilters && (
            <Button variant="link" onClick={clearFilters} className="mt-2">
              Clear filters to see all addons
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default UnifiedAddonDisplay 