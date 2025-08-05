import { db } from '../src/db'
import { createId } from '@paralleldrive/cuid2'

async function fixUserMasterOrg() {
  console.log('🔧 Fixing user master organization linkage...')
  
  const userId = 'user_30IfLCfAFhpkzPFrC69BUJHiSlO' // From the database output
  const existingOrgId = 'rw1aqr5ta1k1nbdr6ee6gcfr' // "Compliance Inc"
  
  try {
    // Get user's party with person record
    const userParty = await db.party.findFirst({
      where: { 
        userId,
        person: { isNot: null }
      },
      include: {
        person: true,
        role: true
      }
    })
    
    if (!userParty) {
      console.error('❌ Could not find user party')
      return
    }
    
    console.log(`👤 Found user party: ${userParty.person?.firstName} ${userParty.person?.lastName}`)
    
    // Check if user already has a master role
    const existingMasterRole = userParty.role.find(role => role.roleType === 'master')
    
    if (existingMasterRole) {
      console.log('✅ User already has master role:', existingMasterRole)
      return
    }
    
    // Create master role linking to existing organization
    const masterRole = await db.role.create({
      data: {
        id: createId(),
        partyId: userParty.id,
        roleType: 'master',
        organizationId: existingOrgId,
        status: 'active',
        isActive: true,
        startDate: new Date()
      }
    })
    
    console.log('✅ Created master role:', masterRole)
    
    // Verify the fix worked
    const updatedUserParty = await db.party.findFirst({
      where: { 
        userId,
        person: { isNot: null }
      },
      include: {
        person: true,
        role: {
          include: {
            // Remove invalid organization include
          }
        }
      }
    })
    
    console.log('🎉 Fix verification:')
    console.log(`   User: ${updatedUserParty?.person?.firstName} ${updatedUserParty?.person?.lastName}`)
    console.log(`   Roles: ${updatedUserParty?.role.length}`)
    updatedUserParty?.role.forEach(role => {
      console.log(`     - ${role.roleType} at organization ${role.organizationId}`)
    })
    
    console.log('🚀 MASTER ORGANIZATION LINKAGE FIXED!')
    console.log(`   Your master org ID is now: ${existingOrgId}`)
    console.log(`   URL to use: /master/${existingOrgId}`)
    
  } catch (error) {
    console.error('❌ Error fixing master org:', error)
  } finally {
    await db.$disconnect()
  }
}

fixUserMasterOrg() 