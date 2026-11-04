export interface Business {
  id: string;
  name: string;
  executiveName: string;
  address: string;
  createdOn: string;
  phone: string;
  email: string;
}

export interface BusinessFormData {
  // Business Details
  businessName: string;
  accountContactEmail: string;
  executiveName: string;
  executiveTitle: string;
  emailForContractSignature: string;

  // Address & Contact
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  fax: string;

  // Settings
  webhookUrl: string;
  applicationEnvironment: "sandbox" | "live";
  sandboxTestLimit: string;
  servicePanels: Record<string, string[]>;
  panelAutoRelease: Record<string, boolean>;
  resultFiles: string[];
  accessibleBy: string[];
}

export const ACCESSIBLE_BY_OPTIONS = ["Karen", "Kelly", "Ram", "Preni", "Jobin"];

export const SERVICE_PANELS: Record<string, string[]> = {
  PGx: ["Cardiology Panel", "Psychiatry Panel", "Pain Management Panel", "Oncology Panel"],
  UTI: ["Standard UTI Panel", "Complicated UTI Panel", "Recurrent UTI Panel"],
  General: ["Wellness Panel", "Metabolic Panel", "Lipid Panel", "Thyroid Panel"],
};
