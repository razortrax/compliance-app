/**
 * Script to rename master organization and check for managed organizations
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function fixOrganizationName() {
  // Your Clerk user ID from the logs
  const targetUserId = "user_30IfLCfAFhpkzPFrC69BUJHiSlO";

  try {
    console.log("🔍 Looking for user organizations...");

    // Find the user's master organization
    const masterOrg = await db.organization.findFirst({
      where: {
        party: {
          userId: targetUserId,
        },
      },
      include: {
        party: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!masterOrg) {
      console.error("❌ No master organization found for user");
      return;
    }

    console.log("📋 Current master organization:", {
      id: masterOrg.id,
      name: masterOrg.name,
      partyId: masterOrg.partyId,
    });

    // Rename master organization
    if (masterOrg.name === "CompApp Consultants") {
      console.log('🔧 Renaming master organization to "CompApp Inc"...');

      await db.organization.update({
        where: { id: masterOrg.id },
        data: { name: "CompApp Inc" },
      });

      console.log('✅ Master organization renamed to "CompApp Inc"');
    } else {
      console.log("✅ Master organization name is already:", masterOrg.name);
    }

    // Check for managed organizations
    console.log("🔍 Looking for managed organizations...");

    const managedRoles = await db.role.findMany({
      where: {
        roleType: "master",
        partyId: masterOrg.partyId,
        isActive: true,
      },
    });

    console.log("📋 Found managed organization roles:", managedRoles.length);

    // Get the actual organizations for these roles
    for (const role of managedRoles) {
      if (role.organizationId) {
        const org = await db.organization.findUnique({
          where: { id: role.organizationId },
        });
        if (org) {
          console.log(`  - ${org.name} (ID: ${org.id})`);
        }
      }
    }

    // Look for any organization named "Speedy Shippin"
    console.log('🔍 Searching for "Speedy Shippin"...');

    const speedyShippin = await db.organization.findMany({
      where: {
        name: {
          contains: "Speedy",
          mode: "insensitive",
        },
      },
      include: {
        party: {
          include: {
            role: {
              where: {
                roleType: "master",
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (speedyShippin.length > 0) {
      console.log('🚛 Found organizations matching "Speedy":');
      speedyShippin.forEach((org, index) => {
        console.log(`  ${index + 1}. ${org.name} (ID: ${org.id})`);
        console.log(`     Party ID: ${org.partyId}`);
        console.log(`     Managed by: ${org.party?.role?.length || 0} master roles`);

        if (org.party?.role?.length === 0) {
          console.log(`     ⚠️  This organization has no master role - it's orphaned!`);
        }
      });
    } else {
      console.log('❌ No organizations found matching "Speedy"');
    }

    // Summary
    console.log("\n📊 Summary:");
    console.log(`   Master Org: ${masterOrg.name} → CompApp Inc`);
    console.log(`   Managed Orgs: ${managedRoles.length}`);
    console.log(`   Speedy Orgs Found: ${speedyShippin.length}`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await db.$disconnect();
  }
}

// Run the script
fixOrganizationName().catch(console.error);
