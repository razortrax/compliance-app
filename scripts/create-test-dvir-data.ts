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
    
    // Create party for driver
    const driverParty = await prisma.party.create({
      data: {
        id: createId(),
        status: 'active'
      }
    })

    // Create person (driver)
    const testDriver = await prisma.person.create({
      data: {
        id: createId(),
        partyId: driverParty.id,
        firstName: 'Robert',
        lastName: 'Johnson',
        dateOfBirth: new Date('1980-03-15'),
        licenseNumber: 'CDL123456789',
        phone: '512-555-0101',
        email: 'robert.johnson@test.com',
        address: '2000 Driver Lane',
        city: 'Austin',
        state: 'TX',
        zipCode: '78702'
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
    
    // Create Peterbilt Tractor
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
        vehicleType: 'Tractor Truck',
        make: 'Peterbilt',
        model: '579',
        year: 2019,
        vinNumber: '1XP5DB9X1KD123456',
        plateNumber: 'ABC123',
        registrationExpiry: new Date('2025-12-31')
      }
    })

    // Create tractor role
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

    // Create Great Dane Trailer
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
        vehicleType: 'Trailer',
        make: 'Great Dane',
        model: 'Flatbed',
        year: 2020,
        vinNumber: '1GRAA0625LB789012',
        plateNumber: 'TRL456',
        registrationExpiry: new Date('2025-12-31')
      }
    })

    // Create trailer role
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
    console.log('\n📋 **Test Data Summary:**')
    console.log(`🏢 Organization: ${testOrg.name} (${testOrg.dotNumber})`)
    console.log(`👤 Driver: ${testDriver.firstName} ${testDriver.lastName} (${testDriver.licenseNumber})`)
    console.log(`🚛 Tractor: ${testTractor.year} ${testTractor.make} ${testTractor.model} (${testTractor.vinNumber})`)
    console.log(`🚚 Trailer: ${testTrailer.year} ${testTrailer.make} ${testTrailer.model} (${testTrailer.vinNumber})`)
    console.log(`⚠️  Violations: ${violations.length} codes available`)

    console.log('\n🧪 **Ready to Test DVIR Upload!**')
    console.log('1. Go to Roadside Inspections page')
    console.log('2. Click "Upload DVIR" button') 
    console.log('3. Upload any PDF/image file (mock data will be used)')
    console.log('4. Verify auto-population with the data above')

  } catch (error) {
    console.error('❌ Error creating test data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createTestDVIRData() 