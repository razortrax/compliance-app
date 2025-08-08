import { db } from "../src/db";

async function debugRoleOrgLinks() {
  console.log("🔍 DEBUGGING ROLE-ORGANIZATION LINKS...");
  console.log("=====================================");

  try {
    // Check ALL organizations
    const allOrgs = await db.organization.findMany({
      include: {
        party: true,
      },
    });

    console.log(`\n🏢 ALL ORGANIZATIONS (${allOrgs.length}):`);
    allOrgs.forEach((org) => {
      console.log(`   • ${org.name} (ID: ${org.id})`);
      console.log(`     Party: ${org.partyId} | User: ${org.party.userId}`);
    });

    // Check ALL roles
    const allRoles = await db.role.findMany({
      include: {
        party: {
          include: {
            person: true,
          },
        },
      },
    });

    console.log(`\n👤 ALL ROLES (${allRoles.length}):`);
    allRoles.forEach((role) => {
      console.log(`   • ${role.roleType} role`);
      console.log(
        `     Party: ${role.partyId} | Person: ${role.party.person?.firstName} ${role.party.person?.lastName}`,
      );
      console.log(`     Points to Org: ${role.organizationId}`);
      console.log(`     Active: ${role.isActive} | Status: ${role.status}`);
    });

    // Check for ORPHANED roles (pointing to non-existent orgs)
    console.log(`\n🔗 CHECKING FOR ORPHANED ROLES:`);
    const orgIds = allOrgs.map((org) => org.id);
    const orphanedRoles = allRoles.filter(
      (role) => role.organizationId && !orgIds.includes(role.organizationId),
    );

    if (orphanedRoles.length > 0) {
      console.log(`❌ FOUND ${orphanedRoles.length} ORPHANED ROLES:`);
      orphanedRoles.forEach((role) => {
        console.log(`   • ${role.roleType} role pointing to MISSING org: ${role.organizationId}`);
        console.log(`     Person: ${role.party.person?.firstName} ${role.party.person?.lastName}`);
      });
    } else {
      console.log(`✅ No orphaned roles found`);
    }

    // Check if specific organization exists
    const oldOrgId = "rw1aqr5ta1k1nbdr6ee6gcfr";
    const newOrgId = "master_org_compliance_inc_stable";

    const oldOrg = await db.organization.findUnique({ where: { id: oldOrgId } });
    const newOrg = await db.organization.findUnique({ where: { id: newOrgId } });

    console.log(`\n🎯 SPECIFIC ORGANIZATION CHECK:`);
    console.log(`   Old org (${oldOrgId}): ${oldOrg ? "✅ EXISTS" : "❌ MISSING"}`);
    console.log(`   New org (${newOrgId}): ${newOrg ? "✅ EXISTS" : "❌ MISSING"}`);

    if (oldOrg) {
      console.log(`   Old org details: ${oldOrg.name}`);
    }
    if (newOrg) {
      console.log(`   New org details: ${newOrg.name}`);
    }
  } catch (error) {
    console.error("❌ Error during debug:", error);
  } finally {
    await db.$disconnect();
  }
}

debugRoleOrgLinks();
