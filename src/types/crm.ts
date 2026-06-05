export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal_sent"
  | "converted"
  | "lost";

export type InterestLevel = "low" | "medium" | "high";

export type OpportunityStage =
  | "prospecting"
  | "needs_review"
  | "quoted"
  | "negotiation"
  | "won"
  | "lost";

export type ActivityType =
  | "call"
  | "meeting"
  | "email"
  | "visit"
  | "whatsapp"
  | "task";

export type ActivityStatus = "open" | "done" | "cancelled";
export type CaseStatus = "open" | "in_progress" | "resolved" | "closed";
export type CasePriority = "low" | "medium" | "high" | "urgent";

export type Lead = {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone_number: string;
  source: string;
  status: LeadStatus;
  interest_level: InterestLevel;
  estimated_value: string;
  next_follow_up_date: string | null;
  assigned_to: number | null;
  assigned_to_name: string;
  converted_client: number | null;
  converted_client_name: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type Contact = {
  id: number;
  client: number | null;
  client_name: string;
  lead: number | null;
  lead_name: string;
  full_name: string;
  role_title: string;
  email: string;
  phone_number: string;
  is_primary: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type Opportunity = {
  id: number;
  title: string;
  client: number | null;
  client_name: string;
  lead: number | null;
  lead_name: string;
  stage: OpportunityStage;
  value: string;
  probability: number;
  expected_close_date: string | null;
  assigned_to: number | null;
  assigned_to_name: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type CRMActivity = {
  id: number;
  subject: string;
  activity_type: ActivityType;
  status: ActivityStatus;
  due_at: string | null;
  completed_at: string | null;
  client: number | null;
  client_name: string;
  lead: number | null;
  lead_name: string;
  opportunity: number | null;
  opportunity_title: string;
  assigned_to: number | null;
  assigned_to_name: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type CustomerCase = {
  id: number;
  title: string;
  client: number | null;
  client_name: string;
  contact: number | null;
  contact_name: string;
  status: CaseStatus;
  priority: CasePriority;
  reported_at: string;
  resolved_at: string | null;
  assigned_to: number | null;
  assigned_to_name: string;
  description: string;
  resolution_notes: string;
  created_at: string;
  updated_at: string;
};

export type CRMSummary = {
  leads_total: number;
  leads_new: number;
  leads_overdue_followups: number;
  opportunities_open: number;
  opportunities_won: number;
  pipeline_value: string | number;
  activities_due: number;
  cases_open: number;
  cases_urgent: number;
};

export type LeadPayload = Omit<
  Lead,
  "id" | "assigned_to_name" | "converted_client_name" | "created_at" | "updated_at"
>;

export type ContactPayload = Omit<
  Contact,
  "id" | "client_name" | "lead_name" | "created_at" | "updated_at"
>;

export type OpportunityPayload = Omit<
  Opportunity,
  "id" | "client_name" | "lead_name" | "assigned_to_name" | "created_at" | "updated_at"
>;

export type CRMActivityPayload = Omit<
  CRMActivity,
  | "id"
  | "client_name"
  | "lead_name"
  | "opportunity_title"
  | "assigned_to_name"
  | "completed_at"
  | "created_at"
  | "updated_at"
>;

export type CustomerCasePayload = {
  title: string;
  client: number | null;
  contact: number | null;
  status: CaseStatus;
  priority: CasePriority;
  reported_at?: string;
  assigned_to: number | null;
  description: string;
  resolution_notes: string;
};
