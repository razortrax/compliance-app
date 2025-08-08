import { NextRequest, NextResponse } from "next/server";
import { captureAPIError, addBreadcrumb } from "@/lib/sentry-utils";

export async function GET(request: NextRequest) {
  try {
    // FIRST: Check if Sentry is properly configured
    const sentryDSN = process.env.SENTRY_DSN;
    const publicDSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

    if (
      !sentryDSN ||
      !publicDSN ||
      sentryDSN.includes("your-dsn-here") ||
      publicDSN.includes("your-dsn-here") ||
      !sentryDSN.includes("sentry.io") ||
      !publicDSN.includes("sentry.io")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "🚨 SENTRY NOT CONFIGURED!",
          message: "Please add your actual Sentry DSN to .env.local",
          debug: {
            sentry_dsn_set: !!sentryDSN,
            public_dsn_set: !!publicDSN,
            dsn_valid: sentryDSN?.includes("sentry.io") || false,
            current_dsn: sentryDSN?.substring(0, 20) + "..." || "NOT SET",
          },
        },
        { status: 500 },
      );
    }

    // Add breadcrumb for tracking
    addBreadcrumb("Testing Sentry integration", {
      endpoint: "/api/test-sentry",
      timestamp: new Date().toISOString(),
    });

    // Simulate a test error to verify Sentry is working
    const testError = new Error("🎉 Sentry is working! This is a test error.");

    // Capture the error with context
    captureAPIError(testError, {
      endpoint: "/api/test-sentry",
      method: "GET",
      extra: {
        message: "This is a successful test of Sentry error capture",
        testMode: true,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "✅ Sentry test error captured! Check your Sentry dashboard.",
      dsn_configured: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // This will also be captured by Sentry automatically
    console.error("Error in Sentry test:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test Sentry",
      },
      { status: 500 },
    );
  }
}
