/**
 * Script to check all data in the database regardless of status
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function checkAllData() {
  try {
    console.log('🔍 Checking ALL data in the database...')
    
    // Check all organizations regardless of status
    console.log('\n🏢 ALL ORGANIZATIONS:')
    const allOrgs = await db.organization.findMany({
      include: {
        party: true
      }
    })
    
    console.log(`Found ${allOrgs.length} total organizations:`)
    allOrgs.forEach((org, index) => {
      console.log(`  ${index + 1}. ${org.name} (Status: ${org.party?.status || 'Unknown'})`)
      console.log(`     ID: ${org.id}`)
      console.log(`     Party ID: ${org.partyId}`)
      console.log(`     User ID: ${org.party?.userId || 'None'}`)
    })
    
    // Check all people regardless of status  
    console.log('\n👥 ALL PEOPLE:')
    const allPeople = await db.person.findMany({
      include: {
        party: true
      }
    })
    
    console.log(`Found ${allPeople.length} total people:`)
    allPeople.forEach((person, index) => {
      console.log(`  ${index + 1}. ${person.firstName} ${person.lastName} (Status: ${person.party?.status || 'Unknown'})`)
      console.log(`     ID: ${person.id}`)
      console.log(`     Party ID: ${person.partyId}`)
      console.log(`     User ID: ${person.party?.userId || 'None'}`)
    })
    
    // Check all equipment regardless of status
    console.log('\n🚛 ALL EQUIPMENT:')
    const allEquipment = await db.equipment.findMany({
      include: {
        party: true
      }
    })
    
    console.log(`Found ${allEquipment.length} total equipment:`)
    allEquipment.forEach((eq, index) => {
      console.log(`  ${index + 1}. ${eq.vehicleType} - ${eq.make} ${eq.model} (Status: ${eq.party?.status || 'Unknown'})`)
      console.log(`     ID: ${eq.id}`)
      console.log(`     Party ID: ${eq.partyId}`)
      console.log(`     User ID: ${eq.party?.userId || 'None'}`)
    })
    
    // Check all roles
    console.log('\n👔 ALL ROLES:')
    const allRoles = await db.role.findMany({
      include: {
        party: {
          include: {
            person: true,
            organization: true,
            equipment: true
          }
        }
      }
    })
    
    console.log(`Found ${allRoles.length} total roles:`)
    allRoles.forEach((role, index) => {
      const entity = role.party?.person?.firstName + ' ' + role.party?.person?.lastName || 
                   role.party?.organization?.name || 
                   role.party?.equipment?.vehicleType || 
                   'Unknown Entity'
      console.log(`  ${index + 1}. ${role.roleType} - ${entity} (Active: ${role.isActive})`)
      console.log(`     Role ID: ${role.id}`)
      console.log(`     Party ID: ${role.partyId}`)
      console.log(`     Organization ID: ${role.organizationId || 'None'}`)
    })
    
    // Check all parties
    console.log('\n🎭 ALL PARTIES:')
    const allParties = await db.party.findMany()
    
    console.log(`Found ${allParties.length} total parties:`)
    allParties.forEach((party, index) => {
      console.log(`  ${index + 1}. Party ID: ${party.id} (Status: ${party.status}, User: ${party.userId || 'None'})`)
    })
    
    // Summary
    console.log('\n📊 DATABASE SUMMARY:')
    console.log(`   Total Organizations: ${allOrgs.length}`)
    console.log(`   Total People: ${allPeople.length}`)
    console.log(`   Total Equipment: ${allEquipment.length}`)
    console.log(`   Total Roles: ${allRoles.length}`)
    console.log(`   Total Parties: ${allParties.length}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

// Run the script
checkAllData().catch(console.error) 