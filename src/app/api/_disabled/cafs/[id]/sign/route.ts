import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'
import { SignatureType, CafStatus } from '@prisma/client'

interface SignatureData {
  signatureType: string
  notes?: string
  digitalSignature: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cafId = params.id
    const data: SignatureData = await request.json()

    if (!data.signatureType || !data.digitalSignature) {
      return NextResponse.json({ 
        error: 'Missing required fields: signatureType and digitalSignature' 
      }, { status: 400 })
    }

    // Verify the CAF exists
    const caf = await db.corrective_action_form.findUnique({
      where: { id: cafId },
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
        signatures: true
      }
    })

    if (!caf) {
      return NextResponse.json({ error: 'CAF not found' }, { status: 404 })
    }

    // Find the staff record for the user signing
    const signingStaff = await db.staff.findFirst({
      where: {
        party: {
          userId: userId
        }
      },
      include: {
        party: {
          include: {
            person: true
          }
        }
      }
    })

    if (!signingStaff) {
      return NextResponse.json({ 
        error: 'Staff record required to sign CAFs. Please contact your administrator.' 
      }, { status: 403 })
    }

    // Validate signature permissions
    const signatureType = data.signatureType as SignatureType
    
    if (signatureType === SignatureType.COMPLETION) {
      // Only the assigned staff or staff with signing permissions can sign completion
      if (caf.assignedStaffId !== signingStaff.id && !signingStaff.canSignCAFs) {
        return NextResponse.json({ 
          error: 'Only the assigned staff member or authorized signers can complete this CAF' 
        }, { status: 403 })
      }
    } else if (signatureType === SignatureType.APPROVAL) {
      // Only staff with approval permissions can approve
      if (!signingStaff.canApproveCAFs) {
        return NextResponse.json({ 
          error: 'You do not have permission to approve CAFs' 
        }, { status: 403 })
      }
    }

    // Check if signature already exists
    const existingSignature = caf.signatures.find(
      sig => sig.staffId === signingStaff.id && sig.signatureType === signatureType
    )

    if (existingSignature) {
      return NextResponse.json({ 
        error: 'You have already signed this CAF with this signature type' 
      }, { status: 400 })
    }

    // Get client IP for audit trail
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'

    // Create signature record
    const signature = await db.caf_signature.create({
      data: {
        id: createId(),
        cafId: cafId,
        staffId: signingStaff.id,
        signatureType: signatureType,
        digitalSignature: data.digitalSignature,
        ipAddress: clientIP,
        notes: data.notes
      },
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
      }
    })

    // Update CAF status based on signature type
    let newStatus = caf.status

    if (signatureType === SignatureType.COMPLETION) {
      newStatus = caf.requiresApproval ? CafStatus.COMPLETED : CafStatus.APPROVED
      
      // Also update completion fields
      await db.corrective_action_form.update({
        where: { id: cafId },
        data: {
          status: newStatus,
          completedAt: new Date(),
          completionNotes: data.notes
        }
      })
    } else if (signatureType === SignatureType.APPROVAL) {
      newStatus = CafStatus.APPROVED
      
      await db.corrective_action_form.update({
        where: { id: cafId },
        data: {
          status: newStatus,
          approvedAt: new Date(),
          approvedBy: signingStaff.id
        }
      })
    }

    // Return success with signature details
    return NextResponse.json({
      message: 'CAF signed successfully',
      signature: {
        id: signature.id,
        signatureType: signature.signatureType,
        signedAt: signature.signedAt,
        staffName: `${signature.staff.party.person?.firstName} ${signature.staff.party.person?.lastName}`,
        notes: signature.notes
      },
      cafStatus: newStatus
    }, { status: 201 })

  } catch (error) {
    console.error('Error signing CAF:', error)
    return NextResponse.json({ 
      error: 'Failed to sign CAF', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 