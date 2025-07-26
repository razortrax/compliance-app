#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const ISSUE_TYPES = {
  driver: {
    sidebarPath: 'src/components/layouts/app-sidebar.tsx',
    menuSection: 'driverId',
    contextType: 'driver'
  },
  equipment: {
    sidebarPath: 'src/components/layouts/app-sidebar.tsx', 
    menuSection: 'equipmentId',
    contextType: 'equipment'
  }
};

function generateIssueType(issueTypeName, entityType, fieldDefinitions) {
  const capitalizedName = issueTypeName.charAt(0).toUpperCase() + issueTypeName.slice(1);
  const snakeName = issueTypeName.toLowerCase().replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  
  console.log(`🚀 Generating ${capitalizedName} Issue Type for ${entityType}...`);
  
  // 1. Generate Prisma Schema Addition
  generatePrismaSchema(issueTypeName, snakeName, fieldDefinitions);
  
  // 2. Generate API Routes
  generateAPIRoutes(issueTypeName, snakeName, capitalizedName, fieldDefinitions);
  
  // 3. Generate React Components
  generateReactComponents(issueTypeName, snakeName, capitalizedName, entityType, fieldDefinitions);
  
  // 4. Generate Main Page
  generateMainPage(issueTypeName, snakeName, capitalizedName, entityType);
  
  // 5. Update Sidebar Navigation
  updateSidebarNavigation(issueTypeName, snakeName, entityType);
  
  console.log(`✅ ${capitalizedName} Issue Type generated successfully!`);
  console.log(`\n📋 Next steps:`);
  console.log(`1. Run: npx prisma db push`);
  console.log(`2. Test the new ${issueTypeName} issue type`);
  console.log(`3. Add any custom business logic`);
}

function generatePrismaSchema(issueTypeName, snakeName, fieldDefinitions) {
  console.log('📊 Generating Prisma schema...');
  
  const enumDefinitions = fieldDefinitions
    .filter(field => field.type === 'ENUM')
    .map(field => {
      const enumName = `${capitalizedName}${field.name.charAt(0).toUpperCase() + field.name.slice(1)}`;
      const values = field.values.map(v => `  ${v.replace(/\s+/g, '_')}`).join('\n');
      return `enum ${enumName} {\n${values}\n}`;
    })
    .join('\n\n');
  
  const modelFields = fieldDefinitions
    .filter(field => !['createdAt', 'updatedAt', 'issueId'].includes(field.name))
    .map(field => {
      let prismaType = field.type;
      let nullable = field.required ? '' : '?';
      let defaultValue = field.default ? ` @default(${field.default})` : '';
      
      if (field.type === 'ENUM') {
        prismaType = `${capitalizedName}${field.name.charAt(0).toUpperCase() + field.name.slice(1)}`;
      } else if (field.type === 'VARCHAR') {
        prismaType = 'String';
      } else if (field.type === 'TEXT') {
        prismaType = 'String';
      } else if (field.type === 'INT') {
        prismaType = 'Int';
      } else if (field.type === 'BOOLEAN') {
        prismaType = 'Boolean';
      } else if (field.type === 'TIMESTAMP') {
        prismaType = 'DateTime';
      }
      
      return `  ${field.name}        ${prismaType}${nullable}${defaultValue}`;
    })
    .join('\n');
  
  const schemaAddition = `
// Add these to your schema.prisma file:

${enumDefinitions}

model ${snakeName}_issue {
  id               String           @id @default(cuid())
  issueId          String           @unique
${modelFields}
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  issue            issue            @relation(fields: [issueId], references: [id], onDelete: Cascade)
}

// Add this to your issue model:
// ${snakeName}_issue   ${snakeName}_issue?
`;
  
  fs.writeFileSync(`generated/${snakeName}_schema.prisma`, schemaAddition);
}

function generateAPIRoutes(issueTypeName, snakeName, capitalizedName, fieldDefinitions) {
  console.log('🔌 Generating API routes...');
  
  // Main route file
  const mainRouteTemplate = `import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'
import { ${fieldDefinitions.filter(f => f.type === 'ENUM').map(f => `${capitalizedName}${f.name.charAt(0).toUpperCase() + f.name.slice(1)}`).join(', ')} } from '@prisma/client'

interface ${capitalizedName}IssueData {
  ${fieldDefinitions.map(field => {
    let tsType = field.type === 'VARCHAR' || field.type === 'TEXT' ? 'string' : 
                 field.type === 'INT' ? 'number' :
                 field.type === 'BOOLEAN' ? 'boolean' :
                 field.type === 'TIMESTAMP' ? 'string' :
                 field.type === 'ENUM' ? 'string' : 'any';
    return `${field.name}${field.required ? '' : '?'}: ${tsType}`;
  }).join('\n  ')}
  title?: string
  description?: string
  dueDate?: string
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const partyId = url.searchParams.get('partyId')
    
    if (!partyId) {
      return Response.json({ error: 'partyId is required' }, { status: 400 })
    }

    const ${snakeName}Issues = await db.${snakeName}_issue.findMany({
      where: {
        issue: {
          partyId: partyId
        }
      },
      include: {
        issue: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return Response.json(${snakeName}Issues)
  } catch (error) {
    console.error('Error fetching ${snakeName} issues:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ${capitalizedName}IssueData = await request.json()
    
    // Validate required fields
    const requiredFields = [${fieldDefinitions.filter(f => f.required && !['createdAt', 'updatedAt', 'issueId'].includes(f.name)).map(f => `'${f.name}'`).join(', ')}]
    for (const field of requiredFields) {
      if (!body[field as keyof ${capitalizedName}IssueData]) {
        return Response.json({ error: \`Missing required field: \${field}\` }, { status: 400 })
      }
    }

    // Check if party exists and user has access
    const party = await db.party.findUnique({
      where: { id: body.partyId! },
      include: { user: true }
    })

    if (!party) {
      return Response.json({ error: 'Party not found' }, { status: 404 })
    }

    // Access control check would go here

    // Create the main issue
    const issue = await db.issue.create({
      data: {
        id: createId(),
        updatedAt: new Date(),
        issueType: '${issueTypeName.toLowerCase()}',
        status: 'active',
        priority: 'medium',
        partyId: body.partyId!,
        title: body.title || \`${capitalizedName} Issue\`,
        description: body.description || \`${capitalizedName} issue record\`,
        dueDate: body.dueDate ? new Date(body.dueDate) : null
      }
    })

    // Create the specific ${snakeName} issue
    const ${snakeName}Issue = await db.${snakeName}_issue.create({
      data: {
        issueId: issue.id,
        ${fieldDefinitions.filter(f => !['createdAt', 'updatedAt', 'issueId'].includes(f.name)).map(field => {
          if (field.type === 'ENUM') {
            return `${field.name}: body.${field.name} ? body.${field.name} as ${capitalizedName}${field.name.charAt(0).toUpperCase() + field.name.slice(1)} : undefined`;
          } else if (field.type === 'TIMESTAMP') {
            return `${field.name}: body.${field.name} ? new Date(body.${field.name}) : undefined`;
          } else {
            return `${field.name}: body.${field.name}${field.default ? ` ?? ${field.default}` : ''}`;
          }
        }).join(',\n        ')}
      },
      include: {
        issue: true
      }
    })

    return Response.json(${snakeName}Issue, { status: 201 })
  } catch (error) {
    console.error('Error creating ${snakeName} issue:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}`;

  fs.writeFileSync(`generated/api_${snakeName}_issues_route.ts`, mainRouteTemplate);
  
  // Individual issue route
  const individualRouteTemplate = `// Similar pattern for [id]/route.ts - GET, PUT, DELETE operations`;
  fs.writeFileSync(`generated/api_${snakeName}_issues_[id]_route.ts`, individualRouteTemplate);
  
  // Renewal route
  const renewalRouteTemplate = `// Renewal route template for ${snakeName} issues`;
  fs.writeFileSync(`generated/api_${snakeName}_issues_renew_route.ts`, renewalRouteTemplate);
}

function generateReactComponents(issueTypeName, snakeName, capitalizedName, entityType, fieldDefinitions) {
  console.log('⚛️ Generating React components...');
  
  // Form component template
  const formTemplate = `"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Loader2, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface ${capitalizedName}IssueFormProps {
  partyId?: string
  ${snakeName}Issue?: any
  onSuccess?: (new${capitalizedName}?: any) => void
  onCancel?: () => void
}

export default function ${capitalizedName}IssueForm({ partyId, ${snakeName}Issue, onSuccess, onCancel }: ${capitalizedName}IssueFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    ${fieldDefinitions.map(field => {
      if (field.type === 'TIMESTAMP') {
        return `${field.name}: ${snakeName}Issue?.${field.name} ? new Date(${snakeName}Issue.${field.name}) : null`;
      } else {
        return `${field.name}: ${snakeName}Issue?.${field.name} || ${field.default || "''"}`;
      }
    }).join(',\n    ')},
    title: ${snakeName}Issue?.issue?.title || '',
    description: ${snakeName}Issue?.issue?.description || ''
  })

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const payload = {
        ...formData,
        partyId: partyId || ${snakeName}Issue?.issue?.partyId,
        ${fieldDefinitions.filter(f => f.type === 'TIMESTAMP').map(f => 
          `${f.name}: formData.${f.name} ? formData.${f.name}.toISOString() : undefined`
        ).join(',\n        ')}
      }

      const url = ${snakeName}Issue 
        ? \`/api/${snakeName}_issues/\${${snakeName}Issue.id}\`
        : '/api/${snakeName}_issues'
      
      const method = ${snakeName}Issue ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save ${snakeName} record')
      }
      
      const saved${capitalizedName} = await res.json()
      if (onSuccess) onSuccess(saved${capitalizedName})
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form fields will be generated based on fieldDefinitions */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>${capitalizedName} issue details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Generated form fields go here */}
        </CardContent>
      </Card>
      
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {${snakeName}Issue ? 'Update' : 'Create'} ${capitalizedName}
        </Button>
      </div>
    </form>
  )
}`;

  fs.writeFileSync(`generated/${snakeName}-issue-form.tsx`, formTemplate);
  
  // Renewal form template  
  const renewalTemplate = `// Renewal form template for ${capitalizedName}`;
  fs.writeFileSync(`generated/${snakeName}-renewal-form.tsx`, renewalTemplate);
}

function generateMainPage(issueTypeName, snakeName, capitalizedName, entityType) {
  console.log('📄 Generating main page...');
  
  const pageTemplate = `"use client"
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { AddAddonModal } from '@/components/licenses/add-addon-modal'
import { ${capitalizedName}IssueForm } from '@/components/${snakeName}_issues/${snakeName}-issue-form'
import { ${capitalizedName}RenewalForm } from '@/components/${snakeName}_issues/${snakeName}-renewal-form'
import { Plus, Edit, Calendar, FileText } from 'lucide-react'
import { format } from 'date-fns'

interface ${capitalizedName}Issue {
  id: string
  issue: {
    id: string
    title: string
    description: string
    status: string
    createdAt: string
    dueDate?: string
  }
  // Add other fields based on your schema
}

export default function ${capitalizedName}IssuesPage() {
  const searchParams = useSearchParams()
  const ${entityType}Id = searchParams.get('${entityType}Id')
  
  const [${snakeName}Issues, set${capitalizedName}Issues] = useState<${capitalizedName}Issue[]>([])
  const [selected${capitalizedName}, setSelected${capitalizedName}] = useState<${capitalizedName}Issue | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showRenewalForm, setShowRenewalForm] = useState(false)
  const [showAddAddonModal, setShowAddAddonModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [attachments, setAttachments] = useState<any[]>([])

  // Standard fetch, create, edit, renewal functions
  // ... (similar to MVR page pattern)

  return (
    <>
      <AppLayout
        name={\`${capitalizedName} Management\`}
        topNav={[]} // Add contextual navigation
        showOrgSelector={true}
        showEntitySelector={true}
        entityType="${entityType}"
        selectedEntityId={${entityType}Id || undefined}
        onEntitySelect={handle${capitalizedName.charAt(0).toUpperCase() + capitalizedName.slice(1)}Select}
      >
        <div className="flex h-full">
          {/* Left Sidebar - ${capitalizedName} List */}
          <div className="w-96 border-r bg-gray-50 overflow-y-auto">
            {/* List implementation */}
          </div>
          
          {/* Right Panel - Details/Forms */}
          <div className="flex-1">
            <Card className="h-full">
              {/* Details/Form implementation */}
            </Card>
          </div>
        </div>
      </AppLayout>
      
      <AddAddonModal
        isOpen={showAddAddonModal}
        onClose={() => setShowAddAddonModal(false)}
        onSuccess={handleAddAddonSuccess}
        issueId={selected${capitalizedName}?.issue.id || ''}
      />
    </>
  )
}`;

  fs.writeFileSync(`generated/${snakeName}_issues_page.tsx`, pageTemplate);
}

function updateSidebarNavigation(issueTypeName, snakeName, entityType) {
  console.log('🔗 Generating sidebar navigation update...');
  
  const sidebarUpdate = `
// Add this to your app-sidebar.tsx in the ${entityType} section:

{
  name: "${issueTypeName.charAt(0).toUpperCase() + issueTypeName.slice(1)}s",
  href: ${entityType}Id ? \`/${snakeName}_issues?${entityType}Id=\${${entityType}Id}\` : "#",
  icon: FileText,
  disabled: !${entityType}Id
}
`;

  fs.writeFileSync(`generated/sidebar_update_${snakeName}.txt`, sidebarUpdate);
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node generate-issue-type.js <issueTypeName> <entityType> [configFile]');
    console.log('Example: node generate-issue-type.js inspection driver inspection-fields.json');
    process.exit(1);
  }
  
  const [issueTypeName, entityType, configFile] = args;
  
  // Create output directory
  if (!fs.existsSync('generated')) {
    fs.mkdirSync('generated');
  }
  
  // Load field definitions from config file or use defaults
  let fieldDefinitions = [];
  if (configFile && fs.existsSync(configFile)) {
    fieldDefinitions = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  } else {
    console.log('⚠️ No config file provided. Using minimal defaults.');
    fieldDefinitions = [
      { name: 'status', type: 'ENUM', values: ['Active', 'Inactive'], required: false, default: 'Active' },
      { name: 'notes', type: 'TEXT', required: false }
    ];
  }
  
  generateIssueType(issueTypeName, entityType, fieldDefinitions);
}

module.exports = { generateIssueType }; 