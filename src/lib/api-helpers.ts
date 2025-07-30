// API Helper Functions with Enhanced Error Handling
import { useState, useCallback } from 'react'

interface ApiResponse<T = any> {
  data?: T
  error?: string
  status: number
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  headers?: Record<string, string>
  timeout?: number
}

export async function apiCall<T = any>(
  endpoint: string, 
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    headers = {},
    timeout = 10000
  } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      signal: controller.signal
    }

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body)
    }

    console.log(`🌐 API Call: ${method} ${endpoint}`)
    const response = await fetch(endpoint, fetchOptions)
    
    clearTimeout(timeoutId)

    console.log(`📊 API Response: ${response.status} ${response.statusText}`)

    if (response.status === 401) {
      console.warn('🔒 Authentication required - redirecting to sign in')
      window.location.href = '/sign-in'
      return { status: 401, error: 'Authentication required' }
    }

    if (response.status === 404) {
      console.warn('🔍 Resource not found')
      return { status: 404, error: 'Resource not found' }
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ API Error: ${response.status} - ${errorText}`)
      return { 
        status: response.status, 
        error: errorText || `HTTP ${response.status}` 
      }
    }

    const data = await response.json()
    console.log(`✅ API Success:`, data)
    
    return { status: response.status, data }

  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('⏱️ API Request timeout')
        return { status: 408, error: 'Request timeout' }
      }
      
      console.error('🔥 API Request failed:', error.message)
      return { status: 0, error: error.message }
    }
    
    console.error('🔥 Unknown API error:', error)
    return { status: 0, error: 'Unknown error occurred' }
  }
}

// Specialized organization API helpers
export async function fetchOrganization(organizationId: string) {
  console.log(`🏢 Fetching organization: ${organizationId}`)
  
  const result = await apiCall(`/api/organizations/${organizationId}`)
  
  if (result.error) {
    console.error(`❌ Failed to fetch organization ${organizationId}:`, result.error)
    return null
  }
  
  return result.data
}

export async function fetchOrganizations() {
  console.log('🏢 Fetching organizations list')
  
  const result = await apiCall('/api/organizations')
  
  if (result.error) {
    console.error('❌ Failed to fetch organizations:', result.error)
    return []
  }
  
  return result.data || []
}

export async function fetchUserProfile() {
  console.log('👤 Fetching user profile')
  
  const result = await apiCall('/api/user/profile')
  
  if (result.error) {
    console.error('❌ Failed to fetch user profile:', result.error)
    return null
  }
  
  return result.data
}

export async function fetchUserRole() {
  console.log('👤 Fetching user role')
  
  const result = await apiCall('/api/user/role')
  
  if (result.error) {
    console.error('❌ Failed to fetch user role:', result.error)
    return null
  }
  
  return result.data
}

// Helper to handle common loading states
export function useAsyncOperation<T>(operation: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await operation()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed')
    } finally {
      setLoading(false)
    }
  }, [operation])

  return { data, loading, error, execute }
} 