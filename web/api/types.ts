/** Types matching the actual PG API response shapes from the Go BFF. */

// ─── Announcements ──────────────────────────────────────────────────────────

export interface PGApiAnnouncementList {
  posts: PGApiAnnouncementSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PGApiAnnouncementSummary {
  id: string;
  postId: number;
  title: string;
  date: string;
  status: 'POSTED' | 'SCHEDULED' | 'DRAFT';
  responseType?: 'VIEW_ONLY' | 'ACKNOWLEDGE' | 'YES_NO';
  toParentsOf: string[];
  readMetrics: { readPerStudent: number; totalStudents: number };
  scheduledSendFailureCode: string | null;
  createdByName: string;
}

export interface PGApiAnnouncementDetail {
  announcementId: number;
  title: string;
  content: string | null;
  richTextContent: string;
  responseType?: 'VIEW_ONLY' | 'ACKNOWLEDGE' | 'YES_NO';
  staffName: string;
  createdBy: number;
  createdAt: string;
  postedDate: string;
  enquiryEmailAddress: string;
  attachments: unknown[];
  images: unknown[];
  shortcutLink: unknown[];
  websiteLinks: unknown[];
  staffOwners: { staffID: number; staffName: string }[];
  students: {
    studentId: number;
    studentName: string;
    className: string;
    isRead: boolean;
  }[];
  status: 'POSTED' | 'SCHEDULED' | 'DRAFT';
  scheduledSendAt: string | null;
  scheduledSendFailureCode: string | null;
}

export interface PGApiReadStatus {
  postId: number;
  totalRecipients: number;
  totalRead: number;
  students: {
    studentId: number;
    studentName: string;
    className: string;
    isRead: boolean;
    readAt: string | null;
  }[];
}

export interface PGApiAnnouncementDraft {
  announcementDraftId: number;
  title: string;
  content: string | null;
  richTextContent: string;
  enquiryEmailAddress: string;
  attachments: unknown[];
  images: unknown[];
  shortcutLink: unknown[];
  websiteLinks: unknown[];
  staffOwners: { staffID: number; staffName: string }[];
  recipients: {
    classIds: number[];
    customGroupIds: number[];
    ccaIds: number[];
    levelIds: number[];
  };
  scheduledSendAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Announcement write payloads ────────────────────────────────────────────

export interface PGApiCreateAnnouncementPayload {
  title: string;
  richTextContent: string;
  enquiryEmailAddress?: string;
  recipients: {
    classIds: number[];
    customGroupIds: number[];
    ccaIds: number[];
    levelIds: number[];
  };
  staffOwnerIds?: number[];
  shortcutLink?: unknown[];
  websiteLinks?: unknown[];
  attachments?: unknown[];
  images?: unknown[];
}

export interface PGApiCreateDraftPayload extends PGApiCreateAnnouncementPayload {
  scheduledSendAt?: string | null;
}

export interface PGApiScheduleDraftPayload {
  announcementDraftId: number;
  scheduledSendAt: string;
}

export interface PGApiDuplicatePayload {
  postId: number;
}

// ─── Consent Forms ──────────────────────────────────────────────────────────

export interface PGApiConsentFormList {
  posts: PGApiConsentFormSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PGApiConsentFormSummary {
  id: string;
  postId: number;
  title: string;
  date: string;
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
  toParentsOf: string[];
  respondedMetrics: { respondedPerStudent: number; totalStudents: number };
  scheduledSendFailureCode: string | null;
  createdByName: string;
  consentByDate: string;
}

export interface PGApiConsentFormDetail {
  consentFormId: number;
  title: string;
  richTextContent: string;
  responseType: string;
  eventStartDate: string;
  eventEndDate: string;
  consentByDate: string;
  addReminderType: string;
  reminderDate: string;
  postedDate: string;
  enquiryEmailAddress: string;
  staffName: string;
  createdBy: number;
  createdAt: string;
  attachments: unknown[];
  images: unknown[];
  websiteLinks: unknown[];
  customQuestions: unknown[];
  staffOwners: { staffID: number; staffName: string }[];
  students: {
    studentId: number;
    studentName: string;
    className: string;
    response: 'YES' | 'NO' | null;
    respondedAt: string | null;
  }[];
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
  consentFormHistory: unknown[];
}

// ─── School Data (for selectors) ────────────────────────────────────────────

export interface PGApiSchoolStaff {
  staffId: number;
  staffName: string;
  email: string;
  schoolEmail: string;
  assignedClass: string | null;
}

export interface PGApiSchoolStaffList {
  staff: PGApiSchoolStaff[];
}

export interface PGApiSchoolGroups {
  classes: { classId: number; className: string; level: string; year: number }[];
  levels: { levelId: number; levelName: string; year: number }[];
  ccas: { ccaId: number; ccaName: string }[];
}

export interface PGApiGroupsAssigned {
  classes: {
    classId: number;
    className: string;
    level: string;
    year: number;
    role: string;
    studentCount: number;
  }[];
  ccas: { ccaId: number; ccaName: string; studentCount: number }[];
  levels: { levelId: number; levelName: string; year: number; studentCount: number }[];
  school: { schoolId: number; schoolName: string; studentCount: number };
}

export interface PGApiClassDetail {
  classId: number;
  className: string;
  level: string;
  year: number;
  students: {
    studentId: number;
    studentName: string;
    admissionNumber: string;
  }[];
  formTeachers: { staffID: number; staffName: string }[];
}

// ─── Session & Config ───────────────────────────────────────────────────────

export interface PGApiSession {
  staffId: number;
  staffName: string;
  isA: boolean;
  staffSchoolId: number;
  staffEmailAdd: string;
  is2FAAuthorized: boolean;
  schoolEmailAddress: string;
  schoolName: string;
  sessionTimeLeft: number;
  displayName: string;
  displayEmail: string;
  displayUpdatedBy: string;
  displayUpdatedAt: string;
  isAdminUpdated: boolean;
  isIhl: boolean;
  heyTaliaAccess: boolean;
}

export interface PGApiConfig {
  flags: Record<string, { enabled: boolean }>;
  configs: Record<string, unknown>;
}

// ─── User Account ───────────────────────────────────────────────────────────

export interface PGApiUserProfile {
  staffId: number;
  staffName: string;
  email: string;
  schoolEmail: string;
  schoolName: string;
  displayName: string;
  displayEmail: string;
}
