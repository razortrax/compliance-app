import { db } from '../src/db'

async function checkMasterOrgData() {
  console.log('🔍 Checking existing master organization data...')
  
  const masterOrgId = 'y39self3k6mzqel7816n30yd'
  
  try {
    // Check if master organization exists
    const masterOrg = await db.organization.findUnique({
      where: { id: masterOrgId },
      include: {
        party: true
      }
    })
    
    console.log('📊 Master Organization:', masterOrg)
    
    // Check ALL organizations
    const allOrgs = await db.organization.findMany({
      include: {
        party: true
      }
    })
    
    console.log('🏢 All Organizations:')
    allOrgs.forEach(org => {
      console.log(`   • ${org.name} (ID: ${org.id}) - User: ${org.party.userId}`)
    })
    
    // Check current user's party and roles
    const userParties = await db.party.findMany({
      where: {
        userId: { not: null }
      },
      include: {
        person: true,
        role: true
      }
    })
    
    console.log('👤 User parties and roles:')
    userParties.forEach(party => {
      console.log(`   Party ID: ${party.id}`)
      console.log(`   User ID: ${party.userId}`)
      console.log(`   Person: ${party.person?.firstName} ${party.person?.lastName}`)
      console.log(`   Roles: ${party.role.length}`)
      party.role.forEach(role => {
        console.log(`     - ${role.roleType} at org: ${role.organizationId}`)
      })
    })
    
    // Check if there are drivers/equipment that might be orphaned
    const totalDrivers = await db.person.count()
    const totalEquipment = await db.equipment.count()
    const totalIssues = await db.issue.count()
    
    console.log('📊 Total data in database:')
    console.log(`   • Drivers: ${totalDrivers}`)
    console.log(`   • Equipment: ${totalEquipment}`)
    console.log(`   • Issues: ${totalIssues}`)
    
  } catch (error) {
    console.error('❌ Error checking data:', error)
  } finally {
    await db.$disconnect()
  }
}

checkMasterOrgData() 