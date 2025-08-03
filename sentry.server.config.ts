import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Set tracesSampleRate to 1.0 to capture 100% of the transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Configure tags for better organization
  initialScope: {
    tags: {
      component: 'fleetrax-backend',
      environment: process.env.NODE_ENV || 'development'
    }
  },
  
  // Configure what errors to capture on server side
  beforeSend(event) {
    // Always capture API errors
    if (event.request?.url?.includes('/api/')) {
      // Add extra context for API errors
      if (event.exception?.values?.[0]) {
        event.exception.values[0].stacktrace = {
          ...event.exception.values[0].stacktrace,
          frames: event.exception.values[0].stacktrace?.frames?.map(frame => ({
            ...frame,
            // Mark API routes for easier debugging
            filename: frame.filename?.includes('/api/') ? `[API] ${frame.filename}` : frame.filename
          }))
        }
      }
      return event
    }
    
    // Capture database errors
    if (event.message?.includes('PrismaClient') ||
        event.message?.includes('database') ||
        event.exception?.values?.[0]?.type?.includes('Prisma')) {
      event.tags = { ...event.tags, category: 'database' }
      return event
    }
    
    // Capture compliance processing errors
    const feature = event.tags?.feature
    if (typeof feature === 'string' && (
        feature.includes('compliance') ||
        feature.includes('driver') ||
        feature.includes('equipment') ||
        feature.includes('dvir') ||
        feature.includes('violation') ||
        feature.includes('inspection'))) {
      return event
    }
    
    return event
  },
  
  // Enable performance monitoring for API routes
  debug: process.env.NODE_ENV === 'development',
  
  // Configure release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
}) 