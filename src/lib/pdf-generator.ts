import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFFont, rgb, StandardFonts } from 'pdf-lib'
import jsPDF from 'jspdf'

export interface CAFData {
  id: string
  cafNumber: string
  incidentId: string
  violationType: string
  violationCodes: string[]
  violationSummary: string
  title?: string
  description?: string
  priority: string
  category: string
  status: string
  organizationId: string
  dueDate?: string
  completionNotes?: string
  completedAt?: string
  approvedAt?: string
  createdAt: string
  assigned_staff?: {
    party: {
      person: {
        firstName: string
        lastName: string
      }
    }
    position: string
  }
  created_by_staff?: {
    party: {
      person: {
        firstName: string
        lastName: string
      }
    }
  }
  organization?: {
    name: string
  }
  signatures?: Array<{
    signatureType: string
    signedAt: string
    digitalSignature: string
    staff: {
      party: {
        person: {
          firstName: string
          lastName: string
        }
      }
    }
  }>
}

export class CAFPDFGenerator {
  private doc: PDFDocument
  private form: PDFForm
  private font: PDFFont
  private boldFont: PDFFont

  constructor() {
    this.doc = PDFDocument.create()
    this.form = this.doc.getForm()
  }

  private async initializeFonts() {
    this.font = await this.doc.embedFont(StandardFonts.Helvetica)
    this.boldFont = await this.doc.embedFont(StandardFonts.HelveticaBold)
  }

  private getCAFTemplate(cafData: CAFData): string {
    const templateType = this.getTemplateType(cafData.category)
    return `${templateType}_CAF_TEMPLATE`
  }

  private getTemplateType(category: string): string {
    switch (category) {
      case 'DRIVER_PERFORMANCE':
      case 'DRIVER_QUALIFICATION':
        return 'DRIVER'
      case 'EQUIPMENT_MAINTENANCE':
        return 'EQUIPMENT'
      case 'COMPANY_OPERATIONS':
        return 'COMPANY'
      default:
        return 'GENERAL'
    }
  }

  async generateFillablePDF(cafData: CAFData): Promise<Uint8Array> {
    await this.initializeFonts()

    // Create new page
    const page = this.doc.addPage([612, 792]) // 8.5 x 11 inches
    const { width, height } = page.getSize()

    // Title
    page.drawText('CORRECTIVE ACTION FORM (CAF)', {
      x: 50,
      y: height - 50,
      size: 18,
      font: this.boldFont,
      color: rgb(0, 0, 0),
    })

    // CAF Number
    page.drawText(`CAF Number: ${cafData.cafNumber}`, {
      x: 400,
      y: height - 50,
      size: 12,
      font: this.boldFont,
    })

    let yPosition = height - 90

    // Organization Information
    page.drawText('ORGANIZATION INFORMATION', {
      x: 50,
      y: yPosition,
      size: 14,
      font: this.boldFont,
    })
    yPosition -= 25

    page.drawText(`Organization: ${cafData.organization?.name || 'N/A'}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: this.font,
    })
    yPosition -= 20

    page.drawText(`Incident ID: ${cafData.incidentId}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: this.font,
    })
    yPosition -= 20

    page.drawText(`Date Created: ${new Date(cafData.createdAt).toLocaleDateString()}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: this.font,
    })
    yPosition -= 40

    // Violation Information
    page.drawText('VIOLATION INFORMATION', {
      x: 50,
      y: yPosition,
      size: 14,
      font: this.boldFont,
    })
    yPosition -= 25

    page.drawText(`Violation Type: ${cafData.violationType}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: this.font,
    })
    yPosition -= 20

    page.drawText(`Priority: ${cafData.priority}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: this.font,
    })
    yPosition -= 20

    page.drawText('Violation Codes:', {
      x: 50,
      y: yPosition,
      size: 10,
      font: this.boldFont,
    })
    yPosition -= 15

    cafData.violationCodes.forEach((code) => {
      page.drawText(`• ${code}`, {
        x: 70,
        y: yPosition,
        size: 9,
        font: this.font,
      })
      yPosition -= 15
    })
    yPosition -= 10

    // Violation Summary
    page.drawText('Violation Summary:', {
      x: 50,
      y: yPosition,
      size: 10,
      font: this.boldFont,
    })
    yPosition -= 15

    // Wrap text for violation summary
    const summaryLines = this.wrapText(cafData.violationSummary, 500, this.font, 9)
    summaryLines.forEach((line) => {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 9,
        font: this.font,
      })
      yPosition -= 12
    })
    yPosition -= 20

    // Assignment Information
    page.drawText('ASSIGNMENT INFORMATION', {
      x: 50,
      y: yPosition,
      size: 14,
      font: this.boldFont,
    })
    yPosition -= 25

    page.drawText(`Assigned To: ${cafData.assigned_staff?.party?.person?.firstName} ${cafData.assigned_staff?.party?.person?.lastName}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: this.font,
    })
    yPosition -= 20

    page.drawText(`Position: ${cafData.assigned_staff?.position || 'N/A'}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: this.font,
    })
    yPosition -= 20

    if (cafData.dueDate) {
      page.drawText(`Due Date: ${new Date(cafData.dueDate).toLocaleDateString()}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font: this.font,
      })
      yPosition -= 20
    }
    yPosition -= 20

    // Add fillable form fields
    await this.addFormFields(yPosition)

    // Add signature areas
    await this.addSignatureAreas(cafData, yPosition - 150)

    return await this.doc.save()
  }

  private async addFormFields(startY: number) {
    let yPosition = startY

    // Corrective Actions Required section
    this.form.createTextField('corrective_actions_title')
    yPosition -= 30

    // Create fillable text area for corrective actions
    const correctiveActionsField = this.form.createTextField('corrective_actions')
    correctiveActionsField.setText('')
    correctiveActionsField.setFontSize(10)
    
    // Add more fillable fields based on CAF type
    const completionNotesField = this.form.createTextField('completion_notes')
    completionNotesField.setText('')
    completionNotesField.setFontSize(10)

    const supervisorCommentsField = this.form.createTextField('supervisor_comments')
    supervisorCommentsField.setText('')
    supervisorCommentsField.setFontSize(10)

    // Status checkboxes
    const statusInProgressBox = this.form.createCheckBox('status_in_progress')
    const statusCompletedBox = this.form.createCheckBox('status_completed')
    const statusApprovedBox = this.form.createCheckBox('status_approved')
  }

  private async addSignatureAreas(cafData: CAFData, startY: number) {
    let yPosition = startY

    // Supervisor Signature Section
    const page = this.doc.getPages()[0]
    
    page.drawText('SUPERVISOR SIGNATURE', {
      x: 50,
      y: yPosition,
      size: 12,
      font: this.boldFont,
    })
    yPosition -= 25

    page.drawText('I certify that the corrective actions have been completed satisfactorily:', {
      x: 50,
      y: yPosition,
      size: 9,
      font: this.font,
    })
    yPosition -= 40

    // Signature line
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: 250, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    })

    page.drawText('Supervisor Signature', {
      x: 50,
      y: yPosition - 15,
      size: 8,
      font: this.font,
    })

    page.drawText('Date: ________________', {
      x: 270,
      y: yPosition,
      size: 9,
      font: this.font,
    })

    yPosition -= 60

    // Approval Signature Section
    page.drawText('SAFETY OFFICE APPROVAL', {
      x: 50,
      y: yPosition,
      size: 12,
      font: this.boldFont,
    })
    yPosition -= 25

    page.drawText('I approve the completion of this corrective action:', {
      x: 50,
      y: yPosition,
      size: 9,
      font: this.font,
    })
    yPosition -= 40

    // Approval signature line
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: 250, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    })

    page.drawText('Safety Office Signature', {
      x: 50,
      y: yPosition - 15,
      size: 8,
      font: this.font,
    })

    page.drawText('Date: ________________', {
      x: 270,
      y: yPosition,
      size: 9,
      font: this.font,
    })

    // Add existing signatures if any
    if (cafData.signatures && cafData.signatures.length > 0) {
      yPosition -= 40
      page.drawText('DIGITAL SIGNATURES ON FILE', {
        x: 50,
        y: yPosition,
        size: 10,
        font: this.boldFont,
      })
      yPosition -= 20

      cafData.signatures.forEach((sig) => {
        const signatureText = `${sig.signatureType}: ${sig.staff.party.person.firstName} ${sig.staff.party.person.lastName} - ${new Date(sig.signedAt).toLocaleString()}`
        page.drawText(signatureText, {
          x: 50,
          y: yPosition,
          size: 8,
          font: this.font,
        })
        yPosition -= 12
      })
    }
  }

  private wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const textWidth = font.widthOfTextAtSize(testLine, fontSize)
      
      if (textWidth <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          lines.push(word)
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine)
    }
    
    return lines
  }

  async generateCompletedPDF(cafData: CAFData): Promise<Uint8Array> {
    await this.initializeFonts()

    // Create a completed (non-fillable) PDF for final records
    const fillablePdf = await this.generateFillablePDF(cafData)
    const existingPdfDoc = await PDFDocument.load(fillablePdf)
    
    // Flatten the form (make it non-editable)
    const form = existingPdfDoc.getForm()
    form.flatten()

    // Add completion stamp
    const pages = existingPdfDoc.getPages()
    const firstPage = pages[0]
    
    if (cafData.status === 'APPROVED') {
      firstPage.drawText('APPROVED', {
        x: 450,
        y: 100,
        size: 24,
        font: this.boldFont,
        color: rgb(0, 0.5, 0),
        rotate: { type: 'degrees', angle: -45 }
      })
    }

    return await existingPdfDoc.save()
  }
}

// HTML to PDF conversion utility
export async function generateCAFFromHTML(htmlContent: string, cafData: CAFData): Promise<Uint8Array> {
  // This would be used for generating PDFs from the web interface
  const pdf = new jsPDF('p', 'mm', 'a4')
  
  // Add header
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text('CORRECTIVE ACTION FORM', 20, 20)
  
  pdf.setFontSize(12)
  pdf.text(`CAF Number: ${cafData.cafNumber}`, 150, 20)
  
  // Add content (this is a simplified version - in practice, you'd parse the HTML)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  
  let yPosition = 40
  const lineHeight = 6
  
  pdf.text(`Organization: ${cafData.organization?.name || 'N/A'}`, 20, yPosition)
  yPosition += lineHeight
  
  pdf.text(`Violation Type: ${cafData.violationType}`, 20, yPosition)
  yPosition += lineHeight
  
  pdf.text(`Priority: ${cafData.priority}`, 20, yPosition)
  yPosition += lineHeight
  
  // Add violation summary with text wrapping
  const summary = pdf.splitTextToSize(cafData.violationSummary, 170)
  pdf.text('Violation Summary:', 20, yPosition)
  yPosition += lineHeight
  pdf.text(summary, 20, yPosition)
  yPosition += summary.length * lineHeight + 10
  
  // Add signatures if present
  if (cafData.signatures && cafData.signatures.length > 0) {
    pdf.text('Digital Signatures:', 20, yPosition)
    yPosition += lineHeight
    
    cafData.signatures.forEach((sig) => {
      const sigText = `${sig.signatureType}: ${sig.staff.party.person.firstName} ${sig.staff.party.person.lastName} - ${new Date(sig.signedAt).toLocaleDateString()}`
      pdf.text(sigText, 20, yPosition)
      yPosition += lineHeight
    })
  }
  
  return new Uint8Array(pdf.output('arraybuffer'))
}

// Utility function to download PDF
export function downloadPDF(pdfBytes: Uint8Array, filename: string) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
} 