export interface BusinessSummary {
  id: string;
  businessName: string;
  reportsGenerated: number;
  reportsRegenerated: number;
  failed: number;
  environment: "live" | "sandbox";
}

export interface ApiDetail {
  apiName: string;
  success: number;
  failed: number;
}

export interface ApiAccessRecord {
  id: string;
  time: string;
  ipAddress: string;
  status: "Success" | "Failed";
  reason?: string;
  // Upload Results API specific
  specimenCount?: number;
  // Reporting API specific
  reportsGenerated?: number;
  reportsRegenerated?: number;
  genePanel?: string;
  drugBankCalls?: number;
  drugsQueried?: number;
  drugsMatched?: number;
  drugsNotMatched?: number;
  // SearchMedications API specific
  medicationCount?: number;
}

export const mockBusinessSummaries: BusinessSummary[] = [
  {
    id: "1",
    businessName: "LabCorp Diagnostics",
    reportsGenerated: 1180,
    reportsRegenerated: 8,
    failed: 70,
    environment: "live",
  },
  {
    id: "2",
    businessName: "Quest Diagnostics",
    reportsGenerated: 845,
    reportsRegenerated: 5,
    failed: 45,
    environment: "live",
  },
  {
    id: "3",
    businessName: "BioReference Labs",
    reportsGenerated: 650,
    reportsRegenerated: 3,
    failed: 25,
    environment: "live",
  },
  {
    id: "4",
    businessName: "Sonic Healthcare",
    reportsGenerated: 400,
    reportsRegenerated: 6,
    failed: 20,
    environment: "live",
  },
  {
    id: "5",
    businessName: "ARUP Laboratories",
    reportsGenerated: 295,
    reportsRegenerated: 4,
    failed: 15,
    environment: "live",
  },
  {
    id: "6",
    businessName: "Test Lab Alpha",
    reportsGenerated: 140,
    reportsRegenerated: 2,
    failed: 10,
    environment: "sandbox",
  },
  {
    id: "7",
    businessName: "Dev Lab Beta",
    reportsGenerated: 78,
    reportsRegenerated: 1,
    failed: 7,
    environment: "sandbox",
  },
  {
    id: "8",
    businessName: "Sandbox Testing Inc",
    reportsGenerated: 42,
    reportsRegenerated: 3,
    failed: 3,
    environment: "sandbox",
  },
];

export const mockApiDetails: Record<string, ApiDetail[]> = {
  "1": [
    { apiName: "Upload Results API", success: 8, failed: 3 },
    { apiName: "Reporting API", success: 7, failed: 2 },
    { apiName: "SearchMedications API", success: 9, failed: 1 },
    { apiName: "GetReports API", success: 5, failed: 2 },
    { apiName: "GetPDFReport API", success: 6, failed: 4 },
    { apiName: "PendingRegeneration API", success: 5, failed: 2 },
  ],
  "2": [
    { apiName: "Upload Results API", success: 9, failed: 2 },
    { apiName: "Reporting API", success: 8, failed: 1 },
    { apiName: "SearchMedications API", success: 7, failed: 3 },
    { apiName: "GetReports API", success: 4, failed: 1 },
    { apiName: "GetPDFReport API", success: 6, failed: 2 },
    { apiName: "PendingRegeneration API", success: 4, failed: 1 },
  ],
  "3": [
    { apiName: "Upload Results API", success: 7, failed: 2 },
    { apiName: "Reporting API", success: 8, failed: 1 },
    { apiName: "SearchMedications API", success: 9, failed: 1 },
    { apiName: "GetReports API", success: 3, failed: 2 },
    { apiName: "GetPDFReport API", success: 5, failed: 3 },
    { apiName: "PendingRegeneration API", success: 6, failed: 1 },
  ],
  "4": [
    { apiName: "Upload Results API", success: 8, failed: 1 },
    { apiName: "Reporting API", success: 7, failed: 2 },
    { apiName: "SearchMedications API", success: 9, failed: 1 },
    { apiName: "GetReports API", success: 5, failed: 1 },
    { apiName: "GetPDFReport API", success: 6, failed: 2 },
    { apiName: "PendingRegeneration API", success: 5, failed: 1 },
  ],
  "5": [
    { apiName: "Upload Results API", success: 7, failed: 2 },
    { apiName: "Reporting API", success: 8, failed: 1 },
    { apiName: "SearchMedications API", success: 6, failed: 1 },
    { apiName: "GetReports API", success: 4, failed: 2 },
    { apiName: "GetPDFReport API", success: 5, failed: 2 },
    { apiName: "PendingRegeneration API", success: 4, failed: 1 },
  ],
  "6": [
    { apiName: "Upload Results API", success: 6, failed: 2 },
    { apiName: "Reporting API", success: 7, failed: 1 },
    { apiName: "SearchMedications API", success: 8, failed: 1 },
    { apiName: "GetReports API", success: 3, failed: 1 },
    { apiName: "GetPDFReport API", success: 5, failed: 2 },
    { apiName: "PendingRegeneration API", success: 4, failed: 1 },
  ],
  "7": [
    { apiName: "Upload Results API", success: 5, failed: 2 },
    { apiName: "Reporting API", success: 6, failed: 1 },
    { apiName: "SearchMedications API", success: 7, failed: 1 },
    { apiName: "GetReports API", success: 2, failed: 1 },
    { apiName: "GetPDFReport API", success: 4, failed: 2 },
    { apiName: "PendingRegeneration API", success: 3, failed: 1 },
  ],
  "8": [
    { apiName: "Upload Results API", success: 4, failed: 1 },
    { apiName: "Reporting API", success: 5, failed: 1 },
    { apiName: "SearchMedications API", success: 6, failed: 0 },
    { apiName: "GetReports API", success: 2, failed: 1 },
    { apiName: "GetPDFReport API", success: 3, failed: 1 },
    { apiName: "PendingRegeneration API", success: 2, failed: 0 },
  ],
};

// Sample failure reasons
const failureReasons = [
  "Connection timeout - server did not respond within 30 seconds",
  "Invalid API key provided",
  "Rate limit exceeded - maximum 100 requests per minute",
  "Malformed request body - missing required field 'specimen_id'",
  "Database connection error",
  "Authentication token expired",
  "Invalid specimen barcode format",
  "Service temporarily unavailable",
  "Request payload too large - maximum 5MB allowed",
  "Duplicate submission detected",
];

const getRandomReason = () => failureReasons[Math.floor(Math.random() * failureReasons.length)];
const generateMockRecords = (count: number, apiName: string): ApiAccessRecord[] => {
  const records: ApiAccessRecord[] = [];
  const successCount = Math.floor(count * 0.7);
  
  for (let i = 0; i < count; i++) {
    const isSuccess = i < successCount;
    const baseRecord: ApiAccessRecord = {
      id: `${apiName}-${i}`,
      time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      status: isSuccess ? "Success" : "Failed",
      reason: isSuccess ? undefined : failureReasons[Math.floor(Math.random() * failureReasons.length)],
    };

    if (apiName === "Upload Results API") {
      baseRecord.specimenCount = Math.floor(Math.random() * 50) + 1;
    } else if (apiName === "Reporting API") {
      baseRecord.reportsGenerated = Math.floor(Math.random() * 20) + 1;
      baseRecord.reportsRegenerated = Math.floor(Math.random() * 5);
      baseRecord.genePanel = Math.random() > 0.5 ? "PanelA" : "PanelB";
      baseRecord.drugBankCalls = Math.floor(Math.random() * 5) + 1;
      baseRecord.drugsQueried = Math.floor(Math.random() * 5) + 1;
      baseRecord.drugsMatched = Math.floor(Math.random() * 5) + 1;
      baseRecord.drugsNotMatched = Math.floor(Math.random() * 5) + 1;
    } else if (apiName === "SearchMedications API") {
      baseRecord.medicationCount = Math.floor(Math.random() * 30) + 1;
      baseRecord.drugBankCalls = Math.floor(Math.random() * 5) + 1;
      baseRecord.drugsQueried = Math.floor(Math.random() * 5) + 1;
      baseRecord.drugsMatched = Math.floor(Math.random() * 5) + 1;
      baseRecord.drugsNotMatched = Math.floor(Math.random() * 5) + 1;
    }
    
    records.push(baseRecord);
  }
  
  return records.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
};

export const getApiAccessRecords = (
  _businessId: string,
  apiName: string,
  successCount: number,
  failedCount: number
): ApiAccessRecord[] => {
  const totalCount = successCount + failedCount;
  const records = generateMockRecords(totalCount, apiName);
  
  // Ensure exact success/failed counts
  let successAssigned = 0;
  let failedAssigned = 0;
  
  return records.map(record => {
    if (successAssigned < successCount && (failedAssigned >= failedCount || Math.random() > 0.3)) {
      successAssigned++;
      return { ...record, status: "Success" as const, reason: undefined };
    } else if (failedAssigned < failedCount) {
      failedAssigned++;
      return { ...record, status: "Failed" as const, reason: getRandomReason() };
    }
    successAssigned++;
    return { ...record, status: "Success" as const, reason: undefined };
  });
};
