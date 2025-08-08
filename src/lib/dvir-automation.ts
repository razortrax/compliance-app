// DVIR Auto-Population System
// Integrates with the unified incident architecture

import { createId } from "@paralleldrive/cuid2";

interface DVIRDocument {
  // Header Information
  reportNumber?: string;
  inspectionDate: string;
  inspectionTime?: string;
  inspectorName: string;
  inspectorBadge?: string;
  agencyName?: string;

  // Location Information
  inspectionLocation: string;
  facilityName?: string;
  facilityAddress?: string;
  facilityCity?: string;
  facilityState?: string;
  facilityZip?: string;

  // Inspection Details
  inspectionLevel: "Level_I" | "Level_II" | "Level_III" | "Level_IV" | "Level_V" | "Level_VI";
  overallResult: "Pass" | "Warning" | "OOS";

  // Driver Information
  driverName?: string;
  driverLicense?: string;
  driverLicenseState?: string;
  driverDOB?: string;

  // Equipment Information
  equipment: DVIREquipment[];

  // Violations
  violations: DVIRViolation[];
}

interface DVIREquipment {
  unitNumber: number;
  unitType?: string; // TT (Tractor Truck), TLR (Trailer), etc.
  make?: string;
  model?: string;
  year?: number;
  plateNumber?: string;
  plateState?: string;
  vin?: string;
  cvsaSticker?: string;
  oosSticker?: string;
}

interface DVIRViolation {
  violationCode: string;
  section: string;
  unitNumber?: number; // Which equipment unit, null for driver violations
  outOfService: boolean;
  outOfServiceDate?: string;
  backInServiceDate?: string;
  citationNumber?: string;
  severity: "WARNING" | "CITATION" | "OUT_OF_SERVICE";
  description: string;
  inspectorComments?: string;
}

interface OCRConfig {
  // AWS Textract Configuration
  aws?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };

  // Google Vision Configuration
  google?: {
    keyFilename: string;
    projectId: string;
  };

  // Azure Form Recognizer Configuration
  azure?: {
    endpoint: string;
    apiKey: string;
  };
}

// DVIR Field Mappings - Standard DVIR form positions
const DVIR_FIELD_MAPPINGS = {
  // Top Section - Inspection Header
  report_number: { section: "header", keywords: ["Report", "Number", "USP"] },
  inspector_name: { section: "header", keywords: ["Inspector", "Name", "Officer"] },
  inspector_badge: { section: "header", keywords: ["Badge", "ID", "Number"] },
  agency_name: { section: "header", keywords: ["Agency", "Department", "Police"] },
  inspection_date: { section: "header", keywords: ["Date", "Inspection"] },
  inspection_time: { section: "header", keywords: ["Time", "Hour"] },

  // Facility Information
  facility_name: { section: "facility", keywords: ["Facility", "Terminal", "Location"] },
  facility_address: { section: "facility", keywords: ["Address", "Street"] },
  facility_city: { section: "facility", keywords: ["City"] },
  facility_state: { section: "facility", keywords: ["State"] },
  facility_zip: { section: "facility", keywords: ["Zip", "Postal"] },

  // Driver Information
  driver_name: { section: "driver", keywords: ["Driver", "Name"] },
  driver_license: { section: "driver", keywords: ["License", "CDL"] },
  driver_license_state: { section: "driver", keywords: ["State", "Issued"] },
  driver_dob: { section: "driver", keywords: ["DOB", "Birth", "Date"] },

  // Equipment Identifiers
  unit_type: { section: "equipment", keywords: ["Unit", "Type", "TT", "TLR"] },
  make: { section: "equipment", keywords: ["Make", "Manufacturer"] },
  model: { section: "equipment", keywords: ["Model"] },
  year: { section: "equipment", keywords: ["Year"] },
  plate_number: { section: "equipment", keywords: ["Plate", "License"] },
  plate_state: { section: "equipment", keywords: ["State"] },
  vin: { section: "equipment", keywords: ["VIN", "Vehicle", "Identification"] },

  // Inspection Results
  inspection_level: { section: "results", keywords: ["Level", "Type"] },
  overall_result: { section: "results", keywords: ["Result", "Pass", "OOS", "Warning"] },

  // Violations Section
  violation_codes: { section: "violations", keywords: ["Violation", "Code", "CFR"] },
  oos_indicators: { section: "violations", keywords: ["OOS", "Out of Service"] },
};

class DVIRProcessor {
  private ocrConfig: OCRConfig;

  constructor(config: OCRConfig) {
    this.ocrConfig = config;
  }

  async processDVIR(file: File): Promise<DVIRDocument> {
    // Step 1: Extract text using OCR
    const rawText = await this.extractTextFromFile(file);

    // Step 2: Parse structured data
    const parsedData = await this.parseStructuredData(rawText);

    // Step 3: Validate and clean data
    const validatedData = await this.validateData(parsedData);

    // Step 4: Return structured DVIR document
    return validatedData;
  }

  private async extractTextFromFile(file: File): Promise<string> {
    // Primary: AWS Textract (most accurate for forms)
    if (this.ocrConfig.aws) {
      return await this.extractWithTextract(file);
    }

    // Fallback: Google Vision API
    if (this.ocrConfig.google) {
      return await this.extractWithGoogleVision(file);
    }

    // Fallback: Azure Form Recognizer
    if (this.ocrConfig.azure) {
      return await this.extractWithAzureFormRecognizer(file);
    }

    throw new Error("No OCR service configured");
  }

  private async extractWithTextract(file: File): Promise<string> {
    // AWS Textract implementation
    // Returns raw text extracted from the document
    // TODO: Implement AWS Textract integration

    // Mock data for testing (replace with actual OCR when credentials added)
    return `
DOT ROADSIDE INSPECTION REPORT
Report Number: US1974906108
Inspection Date: 01/07/2025
Inspection Time: 12:37 PM EST
Inspector: Officer Sarah Martinez
Badge Number: DOT-8847
Agency: Federal Motor Carrier Safety Administration
Location: NEWBERRY SC
Inspection Level: Level I

MOTOR CARRIER INFORMATION
Motor Carrier: WATERS TECH TRANSPORTATION LLC
USDOT Number: 3651508
Address: 725 HIGHWAY 271 SOUTH
City: FORT SMITH
State: AR
Zip: 72908

DRIVER INFORMATION
Driver: Moran Alva Ray
License Number: 0004046218268
License State: SC
Date of Birth: 10/23/1965

VEHICLE IDENTIFICATION
Unit 1 - Tractor Truck
Make: Freightliner
Model: Cascadia
Year: 2024
VIN: 1XKDD903P5S486670
Plate: 2264406
State: SC
Equipment ID: 233
GVWR: 52350
Mileage: 6600
CVSA Sticker: Yes
OOS Sticker: Yes

Unit 2 - Straight Truck
Make: Great Dane
Model: GDAN
Year: 2024
VIN: 1GRA0622KMR51658
Plate: PT205588
State: AR
Mileage: 69000

BRAKE MEASUREMENTS
Steer Axle: Yes
Long Stroke: No
Adjustment: No

VIOLATIONS FOUND
Violation 1:
Code: 393.5(A1-B4LAC)
Section: 393.5(A1-B4LAC)
Unit: 2
Description: Brake - Audible air leak from a brake chamber
Severity: WARNING
OOS: No
Citation: N

HAZARDOUS MATERIALS
HM Type: Non-Bulk
Cargo Tank: Unaffirmed
Rep Class: HM Class 8
B Corrosive material: Y
HMSP Required: Yes

INSPECTION RESULT: SATISFACTORY
Inspector Comments: The undersigned certifies that all violations noted on this report have been corrected and action has been taken to assure compliance with the Federal Motor Carrier Safety and Hazardous Materials Regulations. Results are received into the inspection portal in Southern Portal.

Report Prepared By: Officer Sarah Martinez
Badge ID: DOT-8847
Agency: Federal Motor Carrier Safety Administration
Date: 1/7/25
`;
  }

  private async extractWithGoogleVision(file: File): Promise<string> {
    // Google Vision API implementation
    // TODO: Implement Google Vision integration
    return "Mock extracted text from Google Vision";
  }

  private async extractWithAzureFormRecognizer(file: File): Promise<string> {
    // Azure Form Recognizer implementation
    // TODO: Implement Azure Form Recognizer integration
    return "Mock extracted text from Azure Form Recognizer";
  }

  private async parseStructuredData(rawText: string): Promise<Partial<DVIRDocument>> {
    const dvir: Partial<DVIRDocument> = {};

    // Parse header information
    dvir.reportNumber = this.extractField(rawText, DVIR_FIELD_MAPPINGS.report_number);
    dvir.inspectionDate = this.extractDate(rawText);
    dvir.inspectionTime = this.extractTime(rawText);
    dvir.inspectorName = this.extractField(rawText, DVIR_FIELD_MAPPINGS.inspector_name);

    // Parse facility information
    dvir.facilityName = this.extractField(rawText, DVIR_FIELD_MAPPINGS.facility_name);
    dvir.facilityAddress = this.extractField(rawText, DVIR_FIELD_MAPPINGS.facility_address);

    // Parse equipment information
    dvir.equipment = this.extractEquipment(rawText);

    // Parse violations
    dvir.violations = this.extractViolations(rawText);

    return dvir;
  }

  private extractEquipment(text: string): DVIREquipment[] {
    const equipment: DVIREquipment[] = [];

    // Look for equipment sections (Unit 1, Unit 2, etc.)
    const unitMatches = text.match(/Unit\s+(\d+)/gi);

    if (unitMatches) {
      unitMatches.forEach((match, index) => {
        const unitNumber = parseInt(match.replace(/\D/g, "")) || index + 1;

        // Extract equipment details for this unit
        const equipmentData: DVIREquipment = {
          unitNumber,
          unitType: this.extractNearField(text, match, ["TT", "TLR", "Truck", "Trailer"]),
          make: this.extractNearField(text, match, ["Make"]),
          model: this.extractNearField(text, match, ["Model"]),
          year: this.extractNearFieldAsNumber(text, match, ["Year"]),
          plateNumber: this.extractNearField(text, match, ["Plate", "License"]),
          plateState: this.extractNearField(text, match, ["State"]),
          vin: this.extractNearField(text, match, ["VIN"]),
          cvsaSticker: this.extractNearField(text, match, ["CVSA", "Sticker"]),
          oosSticker: this.extractNearField(text, match, ["OOS", "Sticker"]),
        };

        equipment.push(equipmentData);
      });
    }

    return equipment;
  }

  private extractViolations(text: string): DVIRViolation[] {
    const violations: DVIRViolation[] = [];

    // Look for violation codes (format: 393.75A, 396.17, etc.)
    const violationMatches = text.match(/\d{3}\.\d+[A-Z]*/g);

    if (violationMatches) {
      violationMatches.forEach((code) => {
        // Determine severity based on context
        const contextText = this.getContextAroundCode(text, code);
        let severity: DVIRViolation["severity"] = "WARNING";

        if (contextText.includes("OOS") || contextText.includes("Out of Service")) {
          severity = "OUT_OF_SERVICE";
        } else if (contextText.includes("Citation")) {
          severity = "CITATION";
        }

        const violation: DVIRViolation = {
          violationCode: code,
          section: this.lookupViolationSection(code),
          unitNumber: this.extractUnitNumberForViolation(text, code),
          outOfService: severity === "OUT_OF_SERVICE",
          severity,
          description: this.getViolationDescription(code),
          inspectorComments: this.extractInspectorComments(text, code),
        };

        violations.push(violation);
      });
    }

    return violations;
  }

  // Helper methods for text extraction
  private extractField(text: string, mapping: any): string {
    // Implementation for extracting specific fields based on mappings
    return "";
  }

  private extractDate(text: string): string {
    // Extract date from various formats
    const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
    return dateMatch ? dateMatch[0] : new Date().toISOString().split("T")[0];
  }

  private extractTime(text: string): string {
    // Extract time from various formats
    const timeMatch = text.match(/(\d{1,2}:\d{2}(?:\s*[AP]M)?)/i);
    return timeMatch ? timeMatch[0] : "";
  }

  private extractNearField(text: string, anchor: string, keywords: string[]): string {
    // Extract field value near an anchor point
    return "";
  }

  private extractNearFieldAsNumber(
    text: string,
    anchor: string,
    keywords: string[],
  ): number | undefined {
    const value = this.extractNearField(text, anchor, keywords);
    const number = parseInt(value);
    return isNaN(number) ? undefined : number;
  }

  private getContextAroundCode(text: string, code: string): string {
    const index = text.indexOf(code);
    if (index === -1) return "";

    const start = Math.max(0, index - 100);
    const end = Math.min(text.length, index + 100);
    return text.substring(start, end);
  }

  private lookupViolationSection(code: string): string {
    // Map violation codes to CFR sections
    const cfrMap: { [key: string]: string } = {
      "393.75": "49 CFR 393.75 - Tires",
      "396.17": "49 CFR 396.17 - Periodic inspection",
      "392.2": "49 CFR 392.2 - Driving of commercial motor vehicles",
    };

    const baseCode = code.replace(/[A-Z]+$/, "");
    return cfrMap[baseCode] || `49 CFR ${code}`;
  }

  private extractUnitNumberForViolation(text: string, code: string): number | undefined {
    // Determine which equipment unit the violation applies to
    return undefined;
  }

  private getViolationDescription(code: string): string {
    // Get human-readable description for violation code
    return `Violation ${code}`;
  }

  private extractInspectorComments(text: string, code: string): string {
    // Extract inspector comments for specific violation
    return "";
  }

  private async validateData(data: Partial<DVIRDocument>): Promise<DVIRDocument> {
    // Validate and ensure required fields are present
    const validated = data as DVIRDocument;

    // Set defaults for required fields
    if (!validated.inspectionDate) {
      validated.inspectionDate = new Date().toISOString().split("T")[0];
    }

    if (!validated.inspectorName) {
      validated.inspectorName = "Unknown Inspector";
    }

    if (!validated.inspectionLocation) {
      validated.inspectionLocation = "Unknown Location";
    }

    if (!validated.inspectionLevel) {
      validated.inspectionLevel = "Level_I";
    }

    if (!validated.overallResult) {
      validated.overallResult = "Pass";
    }

    if (!validated.equipment) {
      validated.equipment = [];
    }

    if (!validated.violations) {
      validated.violations = [];
    }

    return validated;
  }
}

// Export interfaces and classes
export type { DVIRDocument, DVIREquipment, DVIRViolation };
export { DVIRProcessor };

/**
 * Check for missing records and create ONLY external parties (Inspector, Agency)
 * Driver and Equipment records should already exist - if missing, notify user
 */
export async function checkAndCreateExternalRecordsFromDVIR(
  dvir: DVIRDocument,
  organizationId: string,
  db: any, // Prisma client
) {
  const createdRecords: any = {};
  const missingRecords: any = {};

  try {
    // 1. Create Inspector as Staff Member (if not exists) - OK to auto-create
    if (dvir.inspectorName && dvir.agencyName) {
      const existingInspector = await db.staff.findFirst({
        where: {
          position: { contains: "Inspector" },
          // Could match by name if needed
        },
      });

      if (!existingInspector) {
        console.log(`🔍 Creating inspector record: ${dvir.inspectorName}`);

        // Create party for inspector
        const inspectorParty = await db.party.create({
          data: {
            id: createId(),
            status: "active",
          },
        });

        // Create person record
        const [firstName, ...lastNameParts] = dvir.inspectorName.split(" ");
        await db.person.create({
          data: {
            id: createId(),
            partyId: inspectorParty.id,
            firstName,
            lastName: lastNameParts.join(" ") || "Inspector",
            email: `${firstName.toLowerCase()}@${dvir.agencyName?.toLowerCase().replace(/\s+/g, "")}.gov`,
          },
        });

        // Create staff record
        const staff = await db.staff.create({
          data: {
            id: createId(),
            partyId: inspectorParty.id,
            position: "DOT Inspector",
            department: dvir.agencyName || "DOT",
            canApproveCAFs: true,
            canSignCAFs: true,
          },
        });

        createdRecords.inspector = staff;
      }
    }

    // 2. CHECK Equipment Records (DO NOT CREATE - notify if missing)
    for (const equipment of dvir.equipment || []) {
      if (equipment.vin) {
        const existingEquipment = await db.equipment.findFirst({
          where: { vinNumber: equipment.vin },
        });

        if (!existingEquipment && equipment.make) {
          console.log(
            `❌ MISSING EQUIPMENT: ${equipment.year} ${equipment.make} ${equipment.model} (VIN: ${equipment.vin})`,
          );

          missingRecords.equipment = missingRecords.equipment || [];
          missingRecords.equipment.push({
            vin: equipment.vin,
            description: `${equipment.year} ${equipment.make} ${equipment.model}`,
            unitType: equipment.unitType,
            unitNumber: equipment.unitNumber,
          });
        }
      }
    }

    // 3. CHECK Driver Record (DO NOT CREATE - notify if missing)
    if (dvir.driverName && dvir.driverLicense) {
      const existingDriver = await db.person.findFirst({
        where: { licenseNumber: dvir.driverLicense },
      });

      if (!existingDriver) {
        console.log(`❌ MISSING DRIVER: ${dvir.driverName} (License: ${dvir.driverLicense})`);

        missingRecords.driver = {
          name: dvir.driverName,
          license: dvir.driverLicense,
          licenseState: dvir.driverLicenseState,
          dob: dvir.driverDOB,
        };
      }
    }

    const result = {
      created: createdRecords,
      missing: missingRecords,
      canProceed: Object.keys(missingRecords).length === 0,
    };

    if (result.canProceed) {
      console.log("✅ All required records exist, ready to create DVIR incident");
    } else {
      console.log("⚠️ Missing critical records - user must add them first:", missingRecords);
    }

    return result;
  } catch (error) {
    console.error("❌ Error checking records from DVIR:", error);
    throw error;
  }
}

export async function createIncidentFromDVIR(
  dvir: DVIRDocument,
  driverId?: string,
  organizationId?: string,
) {
  // Convert DVIR to unified incident format
  return {
    incidentType: "ROADSIDE_INSPECTION",
    incidentDate: dvir.inspectionDate,
    incidentTime: dvir.inspectionTime,
    officerName: dvir.inspectorName,
    agencyName: dvir.agencyName,
    officerBadge: dvir.inspectorBadge,
    reportNumber: dvir.reportNumber,
    locationAddress: dvir.facilityAddress,
    locationCity: dvir.facilityCity,
    locationState: dvir.facilityState,
    locationZip: dvir.facilityZip,

    // Roadside-specific data
    roadsideData: {
      inspectionLevel: dvir.inspectionLevel,
      overallResult: dvir.overallResult,
      facilityName: dvir.facilityName,
      facilityAddress: dvir.facilityAddress,
      facilityCity: dvir.facilityCity,
      facilityState: dvir.facilityState,
      facilityZip: dvir.facilityZip,
      driverLicense: dvir.driverLicense,
      driverLicenseState: dvir.driverLicenseState,
      driverDOB: dvir.driverDOB,
      dvirReceived: true,
      dvirSource: "OCR_Upload",
    },

    // Equipment involvement
    equipment: dvir.equipment.map((eq) => ({
      unitNumber: eq.unitNumber,
      unitType: eq.unitType,
      make: eq.make,
      model: eq.model,
      year: eq.year,
      plateNumber: eq.plateNumber,
      plateState: eq.plateState,
      vin: eq.vin,
      cvsaSticker: eq.cvsaSticker,
      oosSticker: eq.oosSticker,
    })),

    // Violations
    violations: dvir.violations.map((v) => ({
      violationCode: v.violationCode,
      section: v.section,
      unitNumber: v.unitNumber,
      outOfService: v.outOfService,
      outOfServiceDate: v.outOfServiceDate,
      backInServiceDate: v.backInServiceDate,
      citationNumber: v.citationNumber,
      severity: v.severity,
      description: v.description,
      inspectorComments: v.inspectorComments,
    })),

    title: `RSIN - ${dvir.inspectionLocation}`,
    description: `Roadside inspection on ${dvir.inspectionDate}`,

    // UPDATED: Only suggest external record creation
    suggestedRecords: {
      createInspector: !!dvir.inspectorName,
      createAgency: !!dvir.agencyName,
      requiresExistingEquipment: dvir.equipment.filter((eq) => eq.vin && eq.make),
      requiresExistingDriver: !!(dvir.driverName && dvir.driverLicense),
    },
  };
}
