/**
 * Script to find "Speedy Shipping" and its associated data
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function findSpeedyShipping() {
  try {
    console.log('🔍 Searching for "Speedy Shipping"...')
    
    // Search for organizations with "Shipping" in the name
    const organizations = await db.organization.findMany({
      where: {
        OR: [
          { name: { contains: 'Speedy', mode: 'insensitive' } },
          { name: { contains: 'Shipping', mode: 'insensitive' } }
        ]
      },
      include: {
        party: {
          include: {
            role: {
              where: {
                roleType: 'master',
                isActive: true
              }
            }
          }
        }
      }
    })
    
    console.log(`📋 Found ${organizations.length} organizations matching "Speedy" or "Shipping":`)
    
    for (const org of organizations) {
      console.log(`\n🏢 ${org.name} (ID: ${org.id})`)
      console.log(`   Party ID: ${org.partyId}`)
      console.log(`   DOT: ${org.dotNumber || 'None'}`)
      console.log(`   Phone: ${org.phone || 'None'}`)
      console.log(`   Status: ${org.party?.status || 'Unknown'}`)
      console.log(`   Master roles: ${org.party?.role?.length || 0}`)
      
      if (org.party?.role?.length === 0) {
        console.log(`   ⚠️  This organization has NO master role - it's orphaned!`)
      }
      
      // Check for people (drivers) in this organization
      const people = await db.person.findMany({
        where: {
          party: {
            role: {
              some: {
                organizationId: org.id,
                isActive: true
              }
            }
          }
        }
      })
      
      console.log(`   👥 People/Drivers: ${people.length}`)
      if (people.length > 0) {
        people.forEach((person, index) => {
          console.log(`      ${index + 1}. ${person.firstName} ${person.lastName}`)
        })
      }
      
      // Check for equipment in this organization
      const equipment = await db.equipment.findMany({
        where: {
          party: {
            role: {
              some: {
                organizationId: org.id,
                isActive: true
              }
            }
          }
        }
      })
      
      console.log(`   🚛 Equipment: ${equipment.length}`)
      if (equipment.length > 0) {
        equipment.forEach((eq, index) => {
          console.log(`      ${index + 1}. ${eq.vehicleTypeId || 'No Type'} - ${eq.make} ${eq.model} (${eq.year})`)
        })
      }
    }
    
    // Also search for any orphaned people or equipment
    console.log('\n🔍 Checking for orphaned people...')
    const orphanedPeople = await db.person.findMany({
      where: {
        party: {
          role: {
            none: {
              isActive: true
            }
          }
        }
      }
    })
    
    if (orphanedPeople.length > 0) {
      console.log(`⚠️  Found ${orphanedPeople.length} orphaned people:`)
      orphanedPeople.forEach((person, index) => {
        console.log(`   ${index + 1}. ${person.firstName} ${person.lastName} (Party ID: ${person.partyId})`)
      })
    }
    
    console.log('\n🔍 Checking for orphaned equipment...')
    const orphanedEquipment = await db.equipment.findMany({
      where: {
        party: {
          role: {
            none: {
              isActive: true
            }
          }
        }
      }
    })
    
    if (orphanedEquipment.length > 0) {
      console.log(`⚠️  Found ${orphanedEquipment.length} orphaned equipment:`)
      orphanedEquipment.forEach((eq, index) => {
        console.log(`   ${index + 1}. ${eq.vehicleTypeId || 'No Type'} - ${eq.make} ${eq.model} (Party ID: ${eq.partyId})`)
      })
    }
    
    // Summary
    console.log('\n📊 Summary:')
    console.log(`   Organizations found: ${organizations.length}`)
    console.log(`   Orphaned people: ${orphanedPeople.length}`)
    console.log(`   Orphaned equipment: ${orphanedEquipment.length}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

// Run the script
findSpeedyShipping().catch(console.error) 