import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";

// Map FMCSA violation codes to our internal violation types
function mapViolationType(code: string, fmcsaType: string): string {
  // Driver qualification codes (391.x)
  if (code.startsWith("391")) {
    return "Driver_Qualification";
  }
  // Driver performance codes (392.x)
  if (code.startsWith("392")) {
    return "Driver_Performance";
  }
  // Equipment codes (393.x, 396.x)
  if (code.startsWith("393") || code.startsWith("396")) {
    return "Equipment";
  }
  // Company operation codes (390.x)
  if (code.startsWith("390")) {
    return "Company";
  }

  // Fallback to FMCSA type mapping
  switch (fmcsaType) {
    case "Vehicle":
      return "Equipment";
    case "Driver":
      return "Driver_Performance"; // Default driver violations to performance
    case "Other":
      return "Company";
    default:
      return "Company";
  }
}

// Map violation severity based on code and type
function mapViolationSeverity(code: string, violationType: string): string {
  // Equipment violations that are typically OOS
  if (violationType === "Equipment") {
    // Critical brake violations
    if (code.includes("393.47") || code.includes("396.3")) {
      return "OUT_OF_SERVICE";
    }
    // Other equipment violations default to warning
    return "WARNING";
  }

  // Driver violations that are typically OOS
  if (violationType === "Driver_Performance") {
    // HOS violations, impairment, etc.
    if (code.includes("392.2") || code.includes("392.4") || code.includes("395.8")) {
      return "OUT_OF_SERVICE";
    }
    return "WARNING";
  }

  // Most other violations are warnings unless specifically marked
  return "WARNING";
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    // Search violations in database by code or description
    const searchQuery = query.toLowerCase();

    const matchingViolations = await db.violation_code.findMany({
      where: {
        OR: [
          {
            code: {
              contains: searchQuery,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: searchQuery,
              mode: "insensitive",
            },
          },
          {
            violationType: {
              contains: searchQuery,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        code: true,
        description: true,
        violationType: true,
      },
      take: 10, // Limit to 10 results
      orderBy: [{ code: "asc" }],
    });

    // Transform to match the expected format with proper violation type mapping
    const transformedViolations = matchingViolations.map((violation) => {
      const mappedType = mapViolationType(violation.code, violation.violationType);
      return {
        code: violation.code,
        description: violation.description,
        type: mappedType,
        severity: mapViolationSeverity(violation.code, mappedType),
      };
    });

    return NextResponse.json(transformedViolations);
  } catch (error) {
    console.error("Error searching violations:", error);
    return NextResponse.json({ error: "Failed to search violations" }, { status: 500 });
  }
}
