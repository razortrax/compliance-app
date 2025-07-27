/**
 * Script to fix master user account by adding consultant role
 * This allows the master user to manage multiple organizations
 */

import { PrismaClient } from '@prisma/client'
import { createId } from '@paralleldrive/cuid2'

const db = new PrismaClient()

async function fixMasterUser() {
  // Your Clerk user ID from the logs
  const targetUserId = 'user_30IfLCfAFhpkzPFrC69BUJHiSlO'
  
  try {
    console.log('🔍 Looking for user party...')
    
    // Find the user's party
    const userParty = await db.party.findFirst({
      where: { userId: targetUserId },
      include: {
        person: true,
        organization: true,
        role: true,
        consultant: true
      }
    })
    
    if (!userParty) {
      console.error('❌ No party found for user')
      return
    }
    
    console.log('✅ Found user party:', {
      id: userParty.id,
      person: userParty.person?.firstName + ' ' + userParty.person?.lastName,
      organization: userParty.organization?.name,
      roles: userParty.role?.map(r => r.roleType),
      hasConsultant: !!userParty.consultant
    })
    
    // Check if user already has consultant record
    if (!userParty.consultant) {
      console.log('🔧 Creating consultant record...')
      
      await db.consultant.create({
        data: {
          id: createId(),
          partyId: userParty.id,
          isActive: true,
          isVerified: true,
          specializations: ['DOT Compliance', 'Fleet Management'],
          yearsExperience: 5,
          bio: 'Master consultant with full system access'
        }
      })
      
      console.log('✅ Created consultant record')
    } else {
      console.log('✅ Consultant record already exists')
    }
    
    // Check if user has consultant role
    const consultantRole = userParty.role?.find(r => r.roleType === 'consultant' && r.isActive)
    
    if (!consultantRole) {
      console.log('🔧 Creating consultant role...')
      
      await db.role.create({
        data: {
          id: createId(),
          partyId: userParty.id,
          roleType: 'consultant',
          status: 'active',
          isActive: true
        }
      })
      
      console.log('✅ Created consultant role')
    } else {
      console.log('✅ Consultant role already exists')
    }
    
    // Verify the fix
    console.log('🔍 Verifying fix...')
    
    const updatedParty = await db.party.findFirst({
      where: { userId: targetUserId },
      include: {
        person: true,
        organization: true,
        role: true,
        consultant: true
      }
    })
    
    console.log('✅ Final state:', {
      person: updatedParty?.person?.firstName + ' ' + updatedParty?.person?.lastName,
      organization: updatedParty?.organization?.name,
      roles: updatedParty?.role?.map(r => r.roleType),
      hasConsultant: !!updatedParty?.consultant,
      isConsultantActive: updatedParty?.consultant?.isActive
    })
    
    console.log('🎉 Master user fix complete!')
    console.log('📝 You should now see your organization in the dashboard')
    
  } catch (error) {
    console.error('❌ Error fixing master user:', error)
  } finally {
    await db.$disconnect()
  }
}

// Run the script
fixMasterUser().catch(console.error) 