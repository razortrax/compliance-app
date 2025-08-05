import { db } from '../src/db'

async function cleanupOrphanedData() {
  console.log('🧹 Cleaning up orphaned data...')
  
  try {
    // Check for duplicate party records for the same user
    const userParties = await db.party.findMany({
      where: {
        userId: 'user_30IfLCfAFhpkzPFrC69BUJHiSlO'
      },
      include: {
        person: true,
        role: true
      }
    })
    
    console.log(`👤 Found ${userParties.length} party records for user`)
    
    // Find the party with person and master role (the one we want to keep)
    const masterParty = userParties.find(party => 
      party.person && party.role.some(role => role.roleType === 'master')
    )
    
    if (masterParty) {
      console.log(`✅ Keeping master party: ${masterParty.id} (${masterParty.person?.firstName} ${masterParty.person?.lastName})`)
      
      // Find orphaned parties (no person or no master role)
      const orphanedParties = userParties.filter(party => 
        party.id !== masterParty.id && (!party.person || !party.role.some(role => role.roleType === 'master'))
      )
      
      if (orphanedParties.length > 0) {
        console.log(`🗑️ Found ${orphanedParties.length} orphaned party records to clean up`)
        
        for (const orphan of orphanedParties) {
          console.log(`   Deleting orphaned party: ${orphan.id}`)
          
          // Delete roles first
          await db.role.deleteMany({
            where: { partyId: orphan.id }
          })
          
          // Delete person if exists
          if (orphan.person) {
            await db.person.delete({
              where: { partyId: orphan.id }
            })
          }
          
          // Delete party
          await db.party.delete({
            where: { id: orphan.id }
          })
        }
        
        console.log('✅ Orphaned data cleaned up!')
      } else {
        console.log('✅ No orphaned data found - database is clean!')
      }
    }
    
    // Final verification
    const finalUserParties = await db.party.findMany({
      where: {
        userId: 'user_30IfLCfAFhpkzPFrC69BUJHiSlO'
      },
      include: {
        person: true,
        role: true
      }
    })
    
    console.log('\n📊 Final user data:')
    finalUserParties.forEach(party => {
      console.log(`   Party: ${party.id}`)
      console.log(`   Person: ${party.person?.firstName} ${party.person?.lastName}`)
      console.log(`   Roles: ${party.role.map(r => r.roleType).join(', ')}`)
    })
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await db.$disconnect()
  }
}

cleanupOrphanedData() 