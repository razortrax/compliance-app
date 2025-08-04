import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Set tracesSampleRate to 1.0 to capture 100% of the transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.1,
  
  // Capture 100% of the sessions for user session tracking
  replaysSessionSampleRate: 0.1,
  
  // If the entire session is not sampled, use the below sample rate to sample
  // sessions when an error occurs.
  replaysOnErrorSampleRate: 1.0,
  
  // Configure tags for better organization
  initialScope: {
    tags: {
      component: 'fleetrax-frontend',
      environment: process.env.NODE_ENV || 'development'
    }
  },
  
  // Configure what errors to ignore
  beforeSend(event) {
    // Filter out development noise
    if (process.env.NODE_ENV === 'development') {
      // Ignore common development warnings
      if (event.message?.includes('Warning:') || 
          event.message?.includes('You are importing createRoot')) {
        return null
      }
    }
    
    // Always capture compliance-related errors
    const feature = event.tags?.feature
    if (typeof feature === 'string' && (
        feature.includes('compliance') ||
        feature.includes('driver') ||
        feature.includes('equipment') ||
        feature.includes('dvir'))) {
      return event
    }
    
    return event
  },
  
  // Disable debug logging in development to reduce console noise
  debug: false,
  
  // Enable Session Replay for debugging user interactions
  integrations: [
    Sentry.replayIntegration({
      // Capture console logs, network requests, and DOM events
      maskAllText: false,
      blockAllMedia: true,
    }),
  ],
})

// Required for navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart 