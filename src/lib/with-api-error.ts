import { NextRequest, NextResponse } from "next/server";
import { captureAPIError } from "@/lib/sentry-utils";

export type RouteContext = { params?: Record<string, string> };

export function withApiError<C extends RouteContext = RouteContext>(
  endpoint: string,
  handler: (request: NextRequest, context: C) => Promise<NextResponse>,
) {
  return async (request: NextRequest, context: C): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      captureAPIError(error, {
        endpoint,
        method: request.method,
        extra: { params: (context as unknown as RouteContext | undefined)?.params },
      });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
