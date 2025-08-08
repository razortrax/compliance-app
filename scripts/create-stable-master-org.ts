import { db } from "../src/db";
import { createId } from "@paralleldrive/cuid2";

async function createStableMasterOrg() {
  console.log("🏢 Creating stable master organization...");

  const userId = "user_30IfLCfAFhpkzPFrC69BUJHiSlO";
  const masterOrgId = "master_org_compliance_inc_stable"; // PREDICTABLE ID!

  try {
    // Check if master org already exists
    const existingOrg = await db.organization.findUnique({
      where: { id: masterOrgId },
    });

    if (existingOrg) {
      console.log("✅ Master organization already exists:", existingOrg.name);
      return existingOrg;
    }

    // Create organization party
    const orgParty = await db.party.create({
      data: {
        id: createId(),
        userId: userId,
        status: "active",
        updatedAt: new Date(),
      },
    });

    // Create the organization with predictable ID
    const organization = await db.organization.create({
      data: {
        id: masterOrgId, // Use predictable ID
        partyId: orgParty.id,
        name: "Compliance Inc",
        dotNumber: "123456",
        address: "123 Test St",
        city: "Test City",
        state: "TX",
        zipCode: "12345",
        phone: "555-0123",
      },
    });

    // Get user's party
    const userParty = await db.party.findFirst({
      where: {
        userId,
        person: { isNot: null },
      },
    });

    if (!userParty) {
      throw new Error("User party not found");
    }

    // Update existing roles to point to new master org
    await db.role.updateMany({
      where: {
        partyId: userParty.id,
      },
      data: {
        organizationId: masterOrgId,
      },
    });

    // Ensure user has master role
    const existingMasterRole = await db.role.findFirst({
      where: {
        partyId: userParty.id,
        roleType: "master",
      },
    });

    if (!existingMasterRole) {
      await db.role.create({
        data: {
          id: createId(),
          partyId: userParty.id,
          roleType: "master",
          organizationId: masterOrgId,
          status: "active",
          isActive: true,
          startDate: new Date(),
        },
      });
    }

    console.log("🎉 STABLE MASTER ORGANIZATION CREATED!");
    console.log(`   Name: ${organization.name}`);
    console.log(`   ID: ${organization.id}`);
    console.log(`   URL: http://localhost:3000/master/${organization.id}`);
    console.log("");
    console.log("🔒 This organization uses a PREDICTABLE ID and won't get lost during resets!");

    return organization;
  } catch (error) {
    console.error("❌ Error creating stable master org:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

createStableMasterOrg();
