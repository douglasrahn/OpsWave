export interface CampaignEntry {
  id: number;
  campaignId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  contactFirstName: string | null;
  contactLastName: string | null;
  contactPhone: string | null;
  companyName: string;
  companyAddress1: string | null;
  companyAddress2: string | null;
  companyCity: string | null;
  companyState: string | null;
  companyZip: string | null;
  companyPhone: string | null;
  pastDueAmount: number | null;
  previousNotes: string | null;
  log: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  campaignName: string;
  createdAt: string;
  updatedAt: string;
}