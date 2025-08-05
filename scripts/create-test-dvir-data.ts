#!/usr/bin/env tsx

// Test Data Setup for DVIR Auto-Population Testing
// Run with: npx tsx scripts/create-test-dvir-data.ts

import { PrismaClient } from '@prisma/client'
import { createId } from '@paralleldrive/cuid2'

const prisma = new PrismaClient()

async function createTestDVIRData() {
  console.log('🧪 Creating test data for DVIR auto-population...')

  try {
    // 1. Create Test Organization (Company)
    console.log('📊 Creating test organization...')
    
    // Create party for organization
    const orgParty = await prisma.party.create({
      data: {
        id: createId(),
        status: 'active'
      }
    })

    // Create organization
    const testOrg = await prisma.organization.create({
      data: {
        id: createId(),
        partyId: orgParty.id,
        name: 'DVIR Test Transport Inc',
        dotNumber: 'DOT123456',
        einNumber: '12-3456789',
        address: '1000 Test Street',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        phone: '512-555-0100'
      }
    })

    // 2. Create Test Driver (Robert Johnson from mock DVIR)
    console.log('👤 Creating test driver...')
    
    // Create test driver that matches mock DVIR data
    const driverParty = await prisma.party.create({
      data: {
        id: createId(),
        status: 'active'
      }
    })

    const testDriver = await prisma.person.create({
      data: {
        id: createId(),
        partyId: driverParty.id,
        firstName: 'Moran',
        lastName: 'Alva Ray',
        licenseNumber: '0004046218268',
        dateOfBirth: new Date('1965-10-23'),
        email: 'moran.ray@example.com',
        phone: '803-555-0102'
      }
    })

    // Create driver role
    await prisma.role.create({
      data: {
        id: createId(),
        partyId: driverParty.id,
        roleType: 'PERSON',
        organizationId: testOrg.id,
        status: 'active',
        isActive: true
      }
    })

    // 3. Create Test Equipment (Peterbilt + Trailer from mock DVIR)
    console.log('🚛 Creating test equipment...')
    
    // Create equipment that matches mock DVIR data
    // Unit 1 - Tractor Truck (Freightliner Cascadia)
    const tractorParty = await prisma.party.create({
      data: {
        id: createId(),
        status: 'active'
      }
    })

    const testTractor = await prisma.equipment.create({
      data: {
        id: createId(),
        partyId: tractorParty.id,
        make: 'Freightliner',
        model: 'Cascadia',
        year: 2024,
        vin: '1XKDD903P5S486670',
        plateNumber: '2264406',
        registrationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      }
    })

    // Unit 2 - Straight Truck (Great Dane)
    const trailerParty = await prisma.party.create({
      data: {
        id: createId(),
        status: 'active'
      }
    })

    const testTrailer = await prisma.equipment.create({
      data: {
        id: createId(),
        partyId: trailerParty.id,
        make: 'Great Dane',
        model: 'GDAN',
        year: 2024,
        vin: '1GRA0622KMR51658',
        plateNumber: 'PT205588',
        registrationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      }
    })

    // Create roles linking equipment to organization
    await prisma.role.create({
      data: {
        id: createId(),
        partyId: tractorParty.id,
        roleType: 'EQUIPMENT',
        organizationId: testOrg.id,
        status: 'active',
        isActive: true
      }
    })

    await prisma.role.create({
      data: {
        id: createId(),
        partyId: trailerParty.id,
        roleType: 'EQUIPMENT',
        organizationId: testOrg.id,
        status: 'active',
        isActive: true
      }
    })

    // 4. Verify violation codes exist
    console.log('🔍 Checking violation codes...')
    
    const violations = await prisma.violation_code.findMany({
      where: {
        code: {
          in: ['393.75(a)', '396.3(a)(1)']
        }
      }
    })

    console.log(`Found ${violations.length} violation codes in database`)

    console.log('\n✅ Test data created successfully!')
    console.log('📋 Data Summary:')
    console.log(`   Organization: ${testOrg.name} (DOT: ${testOrg.dotNumber})`)
    console.log(`   Driver: Moran Alva Ray (License: 0004046218268)`)
    console.log(`   Equipment 1: 2024 Freightliner Cascadia (VIN: 1XKDD903P5S486670)`)
    console.log(`   Equipment 2: 2024 Great Dane GDAN (VIN: 1GRA0622KMR51658)`)
    console.log('🧪 Ready for DVIR auto-population testing!')

  } catch (error) {
    console.error('❌ Error creating test data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createTestDVIRData() 