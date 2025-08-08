import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: "development",
  debug: true,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.5,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration()],
  beforeSend(event) {
    const message = event.message || "";
    if (/AbortError|ChunkLoadError|ResizeObserver/.test(message)) return null;
    return event;
  },
});

// Optional: export router transition hook if used
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
