"use client";

import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestSentryPage() {
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Test Sentry</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This page is disabled outside development.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Test Sentry (Dev)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => {
              const err = new Error("Manual UI test error");
              Sentry.captureException(err, {
                tags: { area: "dev-test", kind: "ui" },
                extra: { note: "Triggered from /test-sentry UI button" },
              });
              // Also throw to test error boundary behavior
              // setTimeout so Sentry capture has time to send in dev
              setTimeout(() => {
                throw err;
              }, 0);
            }}
          >
            Capture UI exception
          </Button>

          <Button
            variant="outline"
            onClick={async () => {
              try {
                const res = await fetch("/api/force-sentry-test");
                if (!res.ok) throw new Error(`API responded ${res.status}`);
                alert("API call completed (check Sentry)");
              } catch (e) {
                Sentry.captureException(e, {
                  tags: { area: "dev-test", kind: "api" },
                });
                alert("API error captured (check Sentry)");
              }
            }}
          >
            Trigger API test route
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
