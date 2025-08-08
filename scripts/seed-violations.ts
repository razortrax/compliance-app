import { PrismaClient } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function seedViolations() {
  try {
    console.log("🔍 Starting violation codes import...");

    // Read the CSV file
    const csvPath = path.join(
      process.cwd(),
      "documentation",
      "roadside_inspection_violations_250728.csv",
    );
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n");

    // Skip header rows (first 2 lines)
    const dataLines = lines.slice(2).filter((line) => line.trim() && !line.startsWith(","));

    console.log(`📊 Found ${dataLines.length} violation records to import`);

    let imported = 0;
    let skipped = 0;

    for (const line of dataLines) {
      const columns = line.split(",");

      if (columns.length < 4) {
        console.log(`⚠️ Skipping malformed line: ${line}`);
        skipped++;
        continue;
      }

      const violationCode = columns[1]?.trim().replace(/"/g, "");
      const violationType = columns[2]?.trim().replace(/"/g, "");
      const description = columns[3]?.trim().replace(/"/g, "");

      if (!violationCode || !violationType || !description) {
        console.log(`⚠️ Skipping incomplete record: ${violationCode}`);
        skipped++;
        continue;
      }

      try {
        // Check if violation already exists
        const existing = await prisma.violation_code.findUnique({
          where: { code: violationCode },
        });

        if (existing) {
          console.log(`ℹ️ Violation ${violationCode} already exists, skipping`);
          skipped++;
          continue;
        }

        // Create the violation record
        await prisma.violation_code.create({
          data: {
            id: createId(),
            code: violationCode,
            description: description,
            violationType: violationType,
            lastUpdated: new Date(),
            dataSource: "FMCSA_CSV_2025",
          },
        });

        imported++;
        if (imported % 100 === 0) {
          console.log(`✅ Imported ${imported} violations...`);
        }
      } catch (error) {
        console.error(`❌ Error importing violation ${violationCode}:`, error);
        skipped++;
      }
    }

    console.log(`🎉 Import complete!`);
    console.log(`✅ Imported: ${imported} violations`);
    console.log(`⚠️ Skipped: ${skipped} violations`);

    // Test the search to verify it works
    console.log("\n🔍 Testing violation search...");
    const testResults = await prisma.violation_code.findMany({
      where: {
        OR: [
          { code: { contains: "393", mode: "insensitive" } },
          { description: { contains: "393", mode: "insensitive" } },
        ],
      },
      take: 5,
    });

    console.log(`🎯 Found ${testResults.length} violations matching "393":`);
    testResults.forEach((v) => {
      console.log(`  - ${v.code}: ${v.description}`);
    });
  } catch (error) {
    console.error("❌ Error seeding violations:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedViolations()
  .then(() => {
    console.log("✅ Violation seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Violation seeding failed:", error);
    process.exit(1);
  });
