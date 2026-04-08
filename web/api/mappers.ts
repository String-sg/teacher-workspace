import type {
  PGApiAnnouncementDetail,
  PGApiAnnouncementSummary,
  PGApiReadStatus,
} from './types';
import type {
  PGAnnouncement,
  PGOwnership,
  PGRecipient,
  PGStatus,
} from '~/data/mock-pg-announcements';

/**
 * Map a list-endpoint summary to a PGAnnouncement.
 * Fields the API doesn't provide (description, responseType, recipients, response stats)
 * are filled with safe defaults.
 */
export function mapAnnouncementSummary(
  api: PGApiAnnouncementSummary,
  ownership: PGOwnership,
): PGAnnouncement {
  const status = api.status.toLowerCase() as PGStatus;
  const readCount = Math.round(
    api.readMetrics.readPerStudent * api.readMetrics.totalStudents,
  );

  return {
    id: String(api.postId),
    title: api.title,
    description: '',
    status,
    responseType: 'view-only',
    ownership,
    recipients: [],
    stats: {
      totalCount: api.readMetrics.totalStudents,
      readCount,
      responseCount: 0,
      yesCount: 0,
      noCount: 0,
    },
    createdAt: api.date,
    createdBy: api.createdByName,
    // Route the single `date` field to the correct timestamp based on status
    ...(status === 'posted' && { postedAt: api.date }),
    ...(status === 'scheduled' && { scheduledAt: api.date }),
  };
}

/**
 * Map a detail-endpoint response + read-status response to a full PGAnnouncement.
 */
export function mapAnnouncementDetail(
  detail: PGApiAnnouncementDetail,
  readStatus: PGApiReadStatus,
): PGAnnouncement {
  const status = detail.status.toLowerCase() as PGStatus;

  // Build a readAt lookup from the read-status endpoint
  const readAtMap = new Map(
    readStatus.students.map((s) => [s.studentId, s.readAt]),
  );

  const recipients: PGRecipient[] = detail.students.map((s) => ({
    studentId: String(s.studentId),
    studentName: s.studentName,
    classId: s.className,
    parentName: '',
    readStatus: s.isRead ? ('read' as const) : ('unread' as const),
    respondedAt: readAtMap.get(s.studentId) ?? undefined,
    classLabel: s.className,
    indexNo: '',
    parentRelationship: '',
    pgStatus: 'onboarded' as const,
  }));

  return {
    id: String(detail.announcementId),
    title: detail.title,
    description: extractTextFromTiptap(detail.richTextContent),
    status,
    responseType: 'view-only',
    ownership: 'mine',
    recipients,
    stats: {
      totalCount: readStatus.totalRecipients,
      readCount: readStatus.totalRead,
      responseCount: 0,
      yesCount: 0,
      noCount: 0,
    },
    createdAt: detail.createdAt,
    createdBy: detail.staffName,
    postedAt: detail.postedDate,
    scheduledAt: detail.scheduledSendAt ?? undefined,
    staffInCharge: detail.staffOwners[0]?.staffName,
    enquiryEmail: detail.enquiryEmailAddress,
  };
}

/**
 * Merge own and shared announcements, deduplicating by ID.
 * Own posts take priority (ownership: 'mine').
 */
export function mergeAndDedup(
  own: PGAnnouncement[],
  shared: PGAnnouncement[],
): PGAnnouncement[] {
  const ownIds = new Set(own.map((a) => a.id));
  return [...own, ...shared.filter((a) => !ownIds.has(a.id))];
}

/**
 * Extract plain text from a Tiptap JSON string.
 * Concatenates all text nodes, joining paragraphs with newlines.
 */
function extractTextFromTiptap(json: string): string {
  try {
    const doc = JSON.parse(json) as TiptapNode;
    return extractText(doc).trim();
  } catch {
    return '';
  }
}

interface TiptapNode {
  type: string;
  content?: TiptapNode[];
  text?: string;
}

function extractText(node: TiptapNode): string {
  if (node.text) return node.text;
  if (!node.content) return '';

  const parts = node.content.map(extractText);

  // Join paragraph-level nodes with newlines
  if (node.type === 'doc') return parts.join('\n');
  return parts.join('');
}
