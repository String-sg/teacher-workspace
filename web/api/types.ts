/** Types matching the actual PG API response shapes from the Go BFF. */

// ─── List endpoint (/api/web/2/staff/announcements) ────────────────────────

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
  toParentsOf: string[];
  readMetrics: { readPerStudent: number; totalStudents: number };
  scheduledSendFailureCode: string | null;
  createdByName: string;
}

// ─── Detail endpoint (/api/web/2/staff/announcements/{postId}) ─────────────

export interface PGApiAnnouncementDetail {
  announcementId: number;
  title: string;
  content: string | null;
  richTextContent: string;
  staffName: string;
  createdBy: number;
  createdAt: string;
  postedDate: string;
  enquiryEmailAddress: string;
  attachments: unknown[];
  images: unknown[];
  shortcutLink: unknown[];
  websiteLinks: unknown[];
  staffOwners: Array<{ staffID: number; staffName: string }>;
  students: Array<{
    studentId: number;
    studentName: string;
    className: string;
    isRead: boolean;
  }>;
  status: string;
  scheduledSendAt: string | null;
  scheduledSendFailureCode: string | null;
}

// ─── Read status endpoint (/api/web/2/staff/announcements/{postId}/readStatus)

export interface PGApiReadStatus {
  postId: number;
  totalRecipients: number;
  totalRead: number;
  students: Array<{
    studentId: number;
    studentName: string;
    className: string;
    isRead: boolean;
    readAt: string | null;
  }>;
}
