import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  debug: process.env.NODE_ENV !== "production",
  // Helpful tags for grouping
  initialScope: {
    tags: {
      component: "fleetrax-backend",
      environment: process.env.NODE_ENV || "development",
    },
  },
  // Decide what to capture and enrich events
  beforeSend(event) {
    if (event.request?.url?.includes("/api/")) {
      if (event.exception?.values?.[0]) {
        event.exception.values[0].stacktrace = {
          ...event.exception.values[0].stacktrace,
          frames: event.exception.values[0].stacktrace?.frames?.map((frame) => ({
            ...frame,
            filename: frame.filename?.includes("/api/")
              ? `[API] ${frame.filename}`
              : frame.filename,
          })),
        };
      }
      return event;
    }

    if (
      event.message?.includes("PrismaClient") ||
      event.message?.includes("database") ||
      event.exception?.values?.[0]?.type?.includes("Prisma")
    ) {
      event.tags = { ...event.tags, category: "database" };
      return event;
    }

    return event;
  },
  release: process.env.VERCEL_GIT_COMMIT_SHA || "development",
});
