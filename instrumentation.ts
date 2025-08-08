export async function register() {
  // Server-side Sentry initialization
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  // Client-side Sentry initialization for App Router
  if (process.env.NEXT_RUNTIME === "edge" || process.env.NEXT_RUNTIME === "nodejs") {
    // no-op on server/edge for client init
  } else {
    await import("./instrumentation-client");
  }
}
