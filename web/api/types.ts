/** Types matching the actual PG API response shapes from the Go BFF. */

// ─── Shared sub-shapes ──────────────────────────────────────────────────────

export type PGApiAnnouncementStatus = 'POSTED' | 'SCHEDULED' | 'DRAFT' | 'POSTING';
export type PGApiConsentFormStatus = 'OPEN' | 'CLOSED' | 'DRAFT' | 'POSTING';
export type PGApiResponseType = 'VIEW_ONLY' | 'ACKNOWLEDGE' | 'YES_NO';

export interface PGApiStaffOwner {
  staffID: number;
  staffName: string;
}

export interface PGApiAnnouncementStudent {
  studentId: number;
  studentName: string;
  className: string;
  isRead: boolean;
}

export interface PGApiConsentFormStudent {
  studentId: number;
  studentName: string;
  className: string;
  response: 'YES' | 'NO' | null;
  respondedAt: string | null;
}

export interface PGApiImage {
  imageId: number;
  isCover: boolean;
  name: string;
  size: number;
  thumbnailUrl: string;
  url: string;
}

export interface PGApiAttachment {
  attachmentId: number;
  name: string;
  size: number;
  url: string;
}

export interface PGApiWebsiteLink {
  title: string;
  url: string;
}

export interface PGApiShortcutLink {
  shortcutLinkId: number;
  title: string;
  url: string;
}

export interface PGApiAnnouncementTarget {
  announcementId: number;
  announcementTargetId: number;
  createdAt: string;
  isDeleted: boolean;
  targetAcadYear: number;
  targetId: number;
  targetName: string;
  targetSchool: string;
  targetType: string;
  updatedAt: string;
}

export interface PGApiCustomQuestion {
  questionId: number;
  type: 'FREE_TEXT' | 'MCQ';
  text: string;
  options?: string[];
}

export interface PGApiConsentFormHistoryEntry {
  historyId: number;
  action: string;
  actionAt: string;
  actionBy: string;
}

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
  status: PGApiAnnouncementStatus;
  responseType?: PGApiResponseType;
  toParentsOf: string[];
  readMetrics?: { readPerStudent: number; totalStudents: number };
  scheduledSendFailureCode: string | null;
  createdByName: string;
}

export interface PGApiAnnouncementDetail {
  announcementId: number;
  title: string;
  content: string | null;
  richTextContent: Record<string, unknown> | string | null;
  responseType?: PGApiResponseType;
  staffName: string;
  createdBy: number;
  createdAt: string | null;
  postedDate: string | null;
  enquiryEmailAddress: string;
  attachments: PGApiAttachment[];
  images: PGApiImage[];
  shortcutLink: PGApiShortcutLink[];
  websiteLinks: PGApiWebsiteLink[];
  target: PGApiAnnouncementTarget[];
  staffOwners: PGApiStaffOwner[];
  students: PGApiAnnouncementStudent[];
  status: PGApiAnnouncementStatus;
  scheduledSendAt: string | null;
  scheduledSendFailureCode: string | null;
}

export interface PGApiAnnouncementDraft {
  announcementDraftId: number;
  title: string;
  content: string | null;
  richTextContent: Record<string, unknown> | string | null;
  enquiryEmailAddress: string;
  attachments: PGApiAttachment[];
  images: PGApiImage[];
  shortcutLink: PGApiShortcutLink[];
  websiteLinks: PGApiWebsiteLink[];
  staffOwners: PGApiStaffOwner[];
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
  shortcutLink?: PGApiShortcutLink[];
  websiteLinks?: PGApiWebsiteLink[];
  attachments?: PGApiAttachment[];
  images?: PGApiImage[];
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
  status: PGApiConsentFormStatus;
  toParentsOf: string[];
  respondedMetrics: { respondedPerStudent: number; totalStudents: number };
  scheduledSendFailureCode: string | null;
  createdByName: string;
  consentByDate: string | null;
  eventStartDate?: string | null;
  eventEndDate?: string | null;
  eventReminderDate?: string | null;
}

export interface PGApiConsentFormDetail {
  consentFormId: number;
  title: string;
  richTextContent: Record<string, unknown> | string | null;
  responseType: PGApiResponseType;
  eventStartDate: string | null;
  eventEndDate: string | null;
  consentByDate: string | null;
  addReminderType: string;
  reminderDate: string | null;
  postedDate: string | null;
  venue: string | null;
  enquiryEmailAddress: string;
  staffName: string;
  createdBy: number;
  createdAt: string | null;
  attachments: PGApiAttachment[];
  images: PGApiImage[];
  websiteLinks: PGApiWebsiteLink[];
  customQuestions: PGApiCustomQuestion[];
  staffOwners: PGApiStaffOwner[];
  students: PGApiConsentFormStudent[];
  status: PGApiConsentFormStatus;
  consentFormHistory: PGApiConsentFormHistoryEntry[];
}

// ─── School Data (for selectors) ────────────────────────────────────────────

export interface PGApiSchoolStaff {
  staffId: number;
  staffName: string;
  email: string;
  schoolEmail?: string;
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

export interface PGApiGroupsAssignedClass {
  classId: number;
  className: string;
  level: string;
  year: number;
  role: string;
  studentCount: number;
}

export interface PGApiGroupsAssignedCcaGroup {
  ccaId: number;
  ccaDescription: string;
  studentCount: number;
}

export interface PGApiGroupsAssigned {
  classes: PGApiGroupsAssignedClass[];
  ccaGroups: PGApiGroupsAssignedCcaGroup[];
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
  formTeachers?: PGApiStaffOwner[];
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
  staffSchoolId: number;
  email: string;
  schoolEmail: string;
  schoolName: string;
  displayName: string;
  displayEmail: string;
}
