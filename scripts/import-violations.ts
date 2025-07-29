import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient()

interface CSVRow {
  rank: string
  violationCode: string
  type: string
  description: string
  inspections: string
  violations: string
  percentTotal: string
  oosViolations: string
  oosPercent: string
}

// Parse percentage strings to float
const parsePercentage = (percentStr: string): number | null => {
  if (!percentStr || percentStr.trim() === '') return null
  const cleaned = percentStr.replace('%', '').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

// Parse number strings to int
const parseNumber = (numStr: string): number | null => {
  if (!numStr || numStr.trim() === '') return null
  const cleaned = numStr.replace(/,/g, '').trim()
  const num = parseInt(cleaned)
  return isNaN(num) ? null : num
}

// Extract CFR part from violation code
const extractCFRPart = (code: string): number | null => {
  const match = code.match(/^(\d{3})\./)
  return match ? parseInt(match[1]) : null
}

// Determine risk level based on OOS percentage
const calculateRiskMetrics = (oosPercent: number | null, totalViolations: number | null) => {
  const isHighRisk = oosPercent !== null && oosPercent > 5.0 // >5% OOS is high risk
  const isCritical = oosPercent !== null && oosPercent > 10.0 // >10% OOS is critical
  
  // Simple risk score: OOS% * volume factor
  let riskScore = 0
  if (oosPercent !== null && totalViolations !== null) {
    const volumeFactor = Math.min(totalViolations / 1000, 5) // Cap volume factor at 5
    riskScore = oosPercent * volumeFactor
  }
  
  return { isHighRisk, isCritical, riskScore }
}

// Map FMCSA type to our entity categories for CAF grouping validation
const mapViolationType = (fmcsaType: string): string => {
  switch (fmcsaType.toLowerCase()) {
    case 'vehicle':
      return 'Equipment' // Maps to our Equipment CAFs
    case 'driver':
      return 'Driver'    // Maps to our Driver CAFs  
    case 'other':
      return 'Company'   // Maps to our Company CAFs (admin/operational)
    default:
      return 'Other'
  }
}

async function importViolations() {
  try {
    console.log('🚀 Starting FMCSA violation import...')
    
    // Read CSV file
    const csvPath = path.join(process.cwd(), 'documentation/roadside_inspection_violations_250728.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    
    // Parse CSV, skipping header rows
    const records = parse(csvContent, {
      columns: false,
      skip_empty_lines: true,
      from_line: 3 // Skip title and header rows
    })
    
    console.log(`📊 Processing ${records.length} violation records...`)
    
    let imported = 0
    let errors = 0
    
    for (const record of records) {
      try {
        const [rank, violationCode, type, description, inspections, violations, percentTotal, oosViolations, oosPercent] = record
        
        // Skip empty or invalid rows
        if (!violationCode || !description || !type) {
          continue
        }
        
        // Parse numeric fields
        const totalInspections = parseNumber(inspections)
        const totalViolations = parseNumber(violations)
        const percentOfTotal = parsePercentage(percentTotal)
        const oosViolationCount = parseNumber(oosViolations)
        const oosPercentValue = parsePercentage(oosPercent)
        
        // Extract CFR information
        const cfrPart = extractCFRPart(violationCode)
        
        // Calculate risk metrics
        const { isHighRisk, isCritical, riskScore } = calculateRiskMetrics(oosPercentValue, totalViolations)
        
        // Map violation type
        const mappedType = mapViolationType(type)
        
        // Upsert violation record
        await prisma.violation_code.upsert({
          where: { code: violationCode },
          update: {
            description,
            violationType: mappedType,
            totalInspections,
            totalViolations,
            percentOfTotal,
            oosViolations: oosViolationCount,
            oosPercent: oosPercentValue,
            isHighRisk,
            isCritical,
            riskScore,
            cfrPart,
            cfrSection: violationCode, // Store full code as section reference
            lastUpdated: new Date()
          },
          create: {
            code: violationCode,
            description,
            violationType: mappedType,
            totalInspections,
            totalViolations,
            percentOfTotal,
            oosViolations: oosViolationCount,
            oosPercent: oosPercentValue,
            isHighRisk,
            isCritical,
            riskScore,
            cfrPart,
            cfrSection: violationCode,
            effectiveDate: new Date(),
            dataSource: 'FMCSA_CSV_250728'
          }
        })
        
        imported++
        
        if (imported % 100 === 0) {
          console.log(`✅ Processed ${imported} violations...`)
        }
        
      } catch (error) {
        console.error(`❌ Error processing violation ${record[1]}:`, error)
        errors++
      }
    }
    
    // Create snapshot record
    await prisma.violation_snapshot.create({
      data: {
        monthKey: '2025-01',
        fileName: 'roadside_inspection_violations_250728.csv',
        recordCount: imported,
        importedBy: 'system',
        filePath: csvPath,
        notes: `Imported ${imported} violations with ${errors} errors`
      }
    })
    
    console.log(`🎉 Import completed!`)
    console.log(`✅ Successfully imported: ${imported}`)
    console.log(`❌ Errors: ${errors}`)
    
    // Print summary statistics
    const stats = await prisma.violation_code.groupBy({
      by: ['violationType'],
      _count: { id: true }
    })
    
    console.log('\n📊 Violation Distribution:')
    stats.forEach(stat => {
      console.log(`${stat.violationType}: ${stat._count.id} violations`)
    })
    
    // Print high-risk violations
    const highRiskCount = await prisma.violation_code.count({
      where: { isHighRisk: true }
    })
    
    const criticalCount = await prisma.violation_code.count({
      where: { isCritical: true }
    })
    
    console.log(`\n⚠️  High Risk Violations: ${highRiskCount}`)
    console.log(`🚨 Critical Violations: ${criticalCount}`)
    
  } catch (error) {
    console.error('💥 Import failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the import
importViolations().catch(console.error) 