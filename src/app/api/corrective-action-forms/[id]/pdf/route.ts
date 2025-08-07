import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { CAFPDFGenerator } from '@/lib/pdf-generator'

// GET /api/corrective-action-forms/[id]/pdf - Generate CAF PDF
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'fillable' // 'fillable' or 'completed'
    const download = searchParams.get('download') === 'true'

    // Fetch CAF with all related data
    const caf = await db.corrective_action_form.findUnique({
      where: { id: params.id },
      include: {
        assigned_staff: {
          include: {
            party: {
              include: {
                person: true
              }
            }
          }
        },
        created_by_staff: {
          include: {
            party: {
              include: {
                person: true
              }
            }
          }
        },
        approved_by_staff: {
          include: {
            party: {
              include: {
                person: true
              }
            }
          }
        },
        organization: true,
        signatures: {
          include: {
            staff: {
              include: {
                party: {
                  include: {
                    person: true
                  }
                }
              }
            }
          },
          orderBy: { signedAt: 'asc' }
        },
        incident: true
      }
    })

    if (!caf) {
      return NextResponse.json({ error: 'CAF not found' }, { status: 404 })
    }

    // Verify user has access to this CAF
    const masterRole = await db.role.findFirst({
      where: {
        party: { userId },
        roleType: 'master',
        isActive: true
      }
    })

    if (!masterRole) {
      const userRole = await db.role.findFirst({
        where: {
          party: { userId },
          organizationId: caf.organizationId,
          isActive: true
        }
      })

      if (!userRole) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Transform data for PDF generator
    const cafData = {
      id: caf.id,
      cafNumber: caf.cafNumber,
      incidentId: caf.incidentId || 'N/A',
      violationType: caf.violationType || 'Unknown',
      violationCodes: Array.isArray(caf.violationCodes) ? caf.violationCodes as string[] : [],
      violationSummary: caf.violationSummary || 'No summary provided',
      title: caf.title,
      description: caf.description,
      priority: caf.priority,
      category: caf.category,
      status: caf.status,
      organizationId: caf.organizationId,
      dueDate: caf.dueDate?.toISOString(),
      completionNotes: caf.completionNotes,
      completedAt: caf.completedAt?.toISOString(),
      approvedAt: caf.approvedAt?.toISOString(),
      createdAt: caf.createdAt.toISOString(),
      assigned_staff: caf.assigned_staff ? {
        party: {
          person: {
            firstName: caf.assigned_staff.party.person.firstName,
            lastName: caf.assigned_staff.party.person.lastName
          }
        },
        position: caf.assigned_staff.position || 'N/A'
      } : undefined,
      created_by_staff: caf.created_by_staff ? {
        party: {
          person: {
            firstName: caf.created_by_staff.party.person.firstName,
            lastName: caf.created_by_staff.party.person.lastName
          }
        }
      } : undefined,
      organization: caf.organization ? {
        name: caf.organization.name
      } : undefined,
      signatures: caf.signatures?.map(sig => ({
        signatureType: sig.signatureType,
        signedAt: sig.signedAt.toISOString(),
        digitalSignature: sig.digitalSignature || '',
        staff: {
          party: {
            person: {
              firstName: sig.staff.party.person.firstName,
              lastName: sig.staff.party.person.lastName
            }
          }
        }
      })) || []
    }

    // Generate PDF
    const generator = new CAFPDFGenerator()
    let pdfBytes: Uint8Array

    if (format === 'completed') {
      pdfBytes = await generator.generateCompletedPDF(cafData)
    } else {
      pdfBytes = await generator.generateFillablePDF(cafData)
    }

    // Create filename
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `CAF_${caf.cafNumber}_${format}_${timestamp}.pdf`

    // Return PDF
    const response = new NextResponse(pdfBytes)
    response.headers.set('Content-Type', 'application/pdf')
    response.headers.set('Content-Length', pdfBytes.length.toString())
    
    if (download) {
      response.headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    } else {
      response.headers.set('Content-Disposition', `inline; filename="${filename}"`)
    }

    // Log the PDF generation
    await db.activity_log.create({
      data: {
        id: require('@paralleldrive/cuid2').createId(),
        action: 'CAF_PDF_GENERATED',
        entityType: 'corrective_action_form',
        entityId: params.id,
        details: {
          format,
          filename,
          generatedBy: userId,
          fileSize: pdfBytes.length
        },
        userId,
        cafId: params.id
      }
    })

    return response

  } catch (error) {
    console.error('Error generating CAF PDF:', error)
    return NextResponse.json({ 
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 