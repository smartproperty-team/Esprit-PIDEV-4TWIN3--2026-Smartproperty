export enum ApplicationStatus {
  SUBMITTED = "submitted",
  UNDER_REVIEW = "under_review",
  DOCUMENTS_REQUESTED = "documents_requested",
  VIEWING_SCHEDULED = "viewing_scheduled",
  APPROVED = "approved",
  REJECTED = "rejected",
  WITHDRAWN = "withdrawn",
}

export interface EmploymentInfo {
  companyName: string;
  jobTitle: string;
  monthlyIncome: number;
  employmentType?: string;
  startDate?: string;
}

export interface ReferenceInfo {
  name: string;
  relation: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface ApplicationDocument {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  key: string;
  url: string;
  category: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface StatusEvent {
  status: ApplicationStatus;
  note?: string;
  changedBy: string;
  changedAt: string;
}

export interface ViewingSchedule {
  scheduledAt: string;
  location?: string;
  notes?: string;
  scheduledBy: string;
}

export interface Application {
  id: string;
  propertyId: string;
  tenantId: string;
  tenantName?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  ownerId: string;
  managerId?: string;
  status: ApplicationStatus;
  employmentInfo: EmploymentInfo;
  references: ReferenceInfo[];
  messageToOwner?: string;
  propertyTitle?: string;
  propertyAddress?: string;
  propertyPrice?: number;
  ownerName?: string;
  documents: ApplicationDocument[];
  requestedDocuments: string[];
  rejectionReason?: string;
  applicationDeadline?: string;
  deadlineReminderSentAt?: string;
  viewingSchedule?: ViewingSchedule;
  statusHistory: StatusEvent[];
  withdrawnAt?: string;
  withdrawnReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationListResponse {
  applications: Application[];
  total: number;
  page: number;
  limit: number;
}

export interface SubmitApplicationDto {
  propertyId: string;
  employmentInfo: EmploymentInfo;
  references?: ReferenceInfo[];
  messageToOwner?: string;
  applicationDeadline?: string;
}

export interface ApplicationQuery {
  status?: ApplicationStatus;
  propertyId?: string;
  page?: number;
  limit?: number;
}
