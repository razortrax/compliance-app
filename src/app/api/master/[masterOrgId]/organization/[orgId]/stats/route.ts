import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { masterOrgId: string; orgId: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { masterOrgId, orgId } = params

    // 1. Verify user has access to this master organization
    const masterAccess = await db.role.findFirst({
      where: {
        party: { userId },
        organizationId: masterOrgId,
        roleType: 'master',
        isActive: true
      }
    })

    if (!masterAccess) {
      return NextResponse.json({ error: 'Access denied to master organization' }, { status: 403 })
    }

    // 2. Verify the target organization exists and is managed by this master
    const organization = await db.organization.findUnique({
      where: { id: orgId },
      include: {
        party: true
      }
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // 3. Verify master has management role for this organization
    const managementAccess = await db.role.findFirst({
      where: {
        partyId: masterAccess.partyId,
        organizationId: orgId,
        roleType: 'master',
        isActive: true
      }
    })

    if (!managementAccess) {
      return NextResponse.json({ error: 'Access denied to this organization' }, { status: 403 })
    }

    // Define date ranges for expiring issues
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000))
    const ninetyDaysFromNow = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000))

    // 4. Get all statistics in parallel for performance
    const [
      // Driver counts
      totalDrivers,
      
      // Equipment counts
      totalEquipment,
      
      // Issue counts - current active issues
      totalLicenseIssues,
      totalMvrIssues,
      totalTrainingIssues,
      totalPhysicalIssues,
      
      // Expiring issues (within 30 days)
      expiringLicenseIssues,
      expiringMvrIssues,
      expiringTrainingIssues,
      expiringPhysicalIssues,
      
      // Recent issues (created in last 30 days)
      recentLicenseIssues,
      recentMvrIssues,
      recentTrainingIssues,
      recentPhysicalIssues,
      
      // Expired issues (past expiration date)
      expiredLicenseIssues,
      expiredMvrIssues,
      expiredTrainingIssues,
      expiredPhysicalIssues
      
    ] = await Promise.all([
      // Driver counts
      db.role.count({
        where: {
          organizationId: orgId,
          roleType: 'driver',
          isActive: true
        }
      }),
      
      // Equipment counts
      db.role.count({
        where: {
          organizationId: orgId,
          roleType: 'equipment',
          isActive: true
        }
      }),
      
      // Current active issues
      db.license_issue.count({
        where: {
          issue: {
            party: {
              role: {
                some: {
                  organizationId: orgId,
                  roleType: 'driver',
                  isActive: true
                }
              }
            },
            status: 'open'
          }
        }
      }),
      
      db.mvr_issue.count({
        where: {
          issue: {
            party: {
              role: {
                some: {
                  organizationId: orgId,
                  roleType: 'driver',
                  isActive: true
                }
              }
            },
            status: 'open'
          },
          status: 'Active'
        }
      }),
      
      db.training_issue.count({
        where: {
          issue: {
            party: {
              role: {
                some: {
                  organizationId: orgId,
                  roleType: 'driver',
                  isActive: true
                }
              }
            },
            status: 'open'
          }
        }
      }),
      
      db.physical_issue.count({
        where: {
          issue: {
            party: {
              role: {
                some: {
                  organizationId: orgId,
                  roleType: 'driver',
                  isActive: true
                }
              }
            },
            status: 'open'
          }
        }
      }),
      
      // Expiring issues (within 30 days)
      db.license_issue.count({
        where: {
          issue: {
            party: {
              role: {
                some: {
                  organizationId: orgId,
                  roleType: 'driver',
                  isActive: true
                }
              }
            },
            status: 'open'
          },
          expirationDate: {
            lte: thirtyDaysFromNow,
            gte: now
          }
        }
      }),
      
      db.mvr_issue.count({
        where: {
          issue: {
            party: {
              role: {
                some: {
                  organizationId: orgId,
                  roleType: 'driver',
                  isActive: true
                }
              }
            },
            status: 'open'
          },
          status: 'Active',
          expirationDate: {
            lte: thirtyDaysFromNow,
            gte: now
          }
        }
      }),
      
      db.training_issue.count({
        where: {
          issue: {
            party: {
              role: {
                some: {
                  organizationId: orgId,
                  roleType: 'driver',
                  isActive: true
                }
              }
            },
            status: 'open'
          },
          expirationDate: {
            lte: ninetyDaysFromNow, // Training has longer warning period
            gte: now
          }
        }
      }),
      
      db.physical_issue.count({
        where: {
          issue: {
            party: {
              role: {
                some: {
                  organizationId: orgId,
                  roleType: 'driver',
                  isActive: true
                }
              }
            },
            status: 'open'
          },
          expirationDate: {
            lte: thirtyDaysFromNow,
            gte: now
          }
        }
      }),
      
      // Recent issues (created in last 30 days)
      db.license_issue.count({
        where: {
          issue: {
            party: {
              role: {
                some: {
                  organizationId: orgId,
                  roleType: 'driver',
                  isActive: true
                }
              }
            },
            createdAt: {
              gte: new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
            }
          }
        }
      }),
      
      db.mvr_issue.count({
        where: {
          issue: {
            party: {
              role: {
                some: {
                  organizationId: orgId,
                  roleType: 'driver',
                  isActive: true
                }
              }
            },
            createdAt: {
              gte: new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
            }
          }
        }
      }),
      
      db.training_issue.count({
        where: {
          issue: {
            party: {
              role: {
                some: {
                  organizationId: orgId,
                  roleType: 'driver',
                  isActive: true
                }
              }
            },
            createdAt: {
              gte: new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
            }
          }
        }
      }),
      
      db.physical_issue.count({
        where: {
          issue: {
            party: {
              role: {
                some: {
                  organizationId: orgId,
                  roleType: 'driver',
                  isActive: true
                }
              }
            },
            createdAt: {
              gte: new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
            }
          }
        }
      }),
      
      // Expired issues (past expiration date)
      db.license_issue.count({
        where: {
          issue: {
            party: {
              role: {
                some: {
                  organizationId: orgId,
                  roleType: 'driver',
                  isActive: true
                }
              }
            },
            status: 'open'
          },
          expirationDate: {
            lt: now
          }
        }
      }),
      
      db.mvr_issue.count({
        where: {
          issue: {
            party: {
              role: {
                some: {
                  organizationId: orgId,
                  roleType: 'driver',
                  isActive: true
                }
              }
            },
            status: 'open'
          },
          status: 'Active',
          expirationDate: {
            lt: now
          }
        }
      }),
      
      db.training_issue.count({
        where: {
          issue: {
            party: {
              role: {
                some: {
                  organizationId: orgId,
                  roleType: 'driver',
                  isActive: true
                }
              }
            },
            status: 'open'
          },
          expirationDate: {
            lt: now
          }
        }
      }),
      
      db.physical_issue.count({
        where: {
          issue: {
            party: {
              role: {
                some: {
                  organizationId: orgId,
                  roleType: 'driver',
                  isActive: true
                }
              }
            },
            status: 'open'
          },
          expirationDate: {
            lt: now
          }
        }
      })
    ])

    // 5. Calculate derived statistics
    const totalActiveIssues = totalLicenseIssues + totalMvrIssues + totalTrainingIssues + totalPhysicalIssues
    const totalExpiringIssues = expiringLicenseIssues + expiringMvrIssues + expiringTrainingIssues + expiringPhysicalIssues
    const totalRecentIssues = recentLicenseIssues + recentMvrIssues + recentTrainingIssues + recentPhysicalIssues
    const totalExpiredIssues = expiredLicenseIssues + expiredMvrIssues + expiredTrainingIssues + expiredPhysicalIssues

    // Calculate compliance rates
    const driversWithIssues = totalDrivers > 0 ? Math.min(totalActiveIssues, totalDrivers) : 0
    const complianceRate = totalDrivers > 0 ? Math.round(((totalDrivers - driversWithIssues) / totalDrivers) * 100) : 100

    // Determine overall organization health status
    let healthStatus: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent'
    if (totalExpiredIssues > 0) healthStatus = 'critical'
    else if (totalExpiringIssues > 0) healthStatus = 'warning'
    else if (totalActiveIssues > totalDrivers * 2) healthStatus = 'good' // Many issues but not expired
    
    console.log(`📊 Org ${orgId} Stats: ${totalDrivers} drivers, ${totalActiveIssues} issues, ${complianceRate}% compliance`)

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        dotNumber: organization.dotNumber
      },
      summary: {
        totalDrivers,
        totalEquipment,
        totalActiveIssues,
        complianceRate,
        healthStatus
      },
      issues: {
        total: {
          licenses: totalLicenseIssues,
          mvrs: totalMvrIssues,
          training: totalTrainingIssues,
          physicals: totalPhysicalIssues,
          all: totalActiveIssues
        },
        expiring: {
          licenses: expiringLicenseIssues,
          mvrs: expiringMvrIssues,
          training: expiringTrainingIssues,
          physicals: expiringPhysicalIssues,
          all: totalExpiringIssues
        },
        expired: {
          licenses: expiredLicenseIssues,
          mvrs: expiredMvrIssues,
          training: expiredTrainingIssues,
          physicals: expiredPhysicalIssues,
          all: totalExpiredIssues
        },
        recent: {
          licenses: recentLicenseIssues,
          mvrs: recentMvrIssues,
          training: recentTrainingIssues,
          physicals: recentPhysicalIssues,
          all: totalRecentIssues
        }
      },
      trends: {
        complianceRate,
        driversWithIssues,
        issuesPerDriver: totalDrivers > 0 ? Math.round((totalActiveIssues / totalDrivers) * 100) / 100 : 0,
        equipmentPerDriver: totalDrivers > 0 ? Math.round((totalEquipment / totalDrivers) * 100) / 100 : 0
      }
    })

  } catch (error) {
    console.error('Error fetching organization stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 