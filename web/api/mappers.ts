import type {
  PGAnnouncement,
  PGOwnership,
  PGRecipient,
  PGStatus,
  ResponseType,
} from '~/data/mock-pg-announcements';

import type {
  PGApiAnnouncementDetail,
  PGApiAnnouncementStatus,
  PGApiAnnouncementSummary,
  PGApiConsentFormSummary,
  PGApiCreateAnnouncementPayload,
} from './types';

/**
 * Map a list-endpoint summary to a PGAnnouncement.
 * Fields the API doesn't provide (description, responseType, recipients, response stats)
 * are filled with safe defaults.
 */
export function mapAnnouncementSummary(
  api: PGApiAnnouncementSummary,
  ownership: PGOwnership,
): PGAnnouncement {
  const status = toPGStatus(api.status);
  const totalCount = api.readMetrics?.totalStudents ?? 0;
  const readCount = api.readMetrics
    ? Math.round(api.readMetrics.readPerStudent * api.readMetrics.totalStudents)
    : 0;

  return {
    id: String(api.postId),
    title: api.title,
    description: '',
    status,
    responseType: mapResponseType(api.responseType),
    ownership,
    recipients: [],
    stats: {
      totalCount,
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
 * PG's detail embeds read status on `students[].isRead`; per-student `readAt`
 * is not exposed by PG, so `respondedAt` is left undefined.
 */
export function mapAnnouncementDetail(detail: PGApiAnnouncementDetail): PGAnnouncement {
  const status = toPGStatus(detail.status);
  const totalCount = detail.students.length;
  const readCount = detail.students.filter((s) => s.isRead).length;

  const recipients: PGRecipient[] = detail.students.map((s) => ({
    studentId: String(s.studentId),
    studentName: s.studentName,
    classId: s.className,
    parentName: '',
    readStatus: s.isRead ? ('read' as const) : ('unread' as const),
    respondedAt: undefined,
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
    responseType: mapResponseType(detail.responseType),
    ownership: 'mine',
    recipients,
    stats: {
      totalCount,
      readCount,
      responseCount: 0,
      yesCount: 0,
      noCount: 0,
    },
    createdAt: detail.createdAt ?? undefined,
    createdBy: detail.staffName,
    postedAt: detail.postedDate ?? undefined,
    scheduledAt: detail.scheduledSendAt ?? undefined,
    staffInCharge: detail.staffOwners[0]?.staffName,
    enquiryEmail: detail.enquiryEmailAddress,
  };
}

/**
 * Map a consent form summary from the API to a list item with ownership.
 */
export function mapConsentFormSummary(
  api: PGApiConsentFormSummary,
  ownership: 'mine' | 'shared',
): PGApiConsentFormSummary & { ownership: 'mine' | 'shared' } {
  return { ...api, ownership };
}

/**
 * Merge own and shared announcements, deduplicating by ID.
 * Own posts take priority (ownership: 'mine').
 */
export function mergeAndDedup<T extends { id: string }>(own: T[], shared: T[]): T[] {
  const ownIds = new Set(own.map((a) => a.id));
  return [...own, ...shared.filter((a) => !ownIds.has(a.id))];
}

const RESPONSE_TYPE_MAP: Record<string, ResponseType> = {
  VIEW_ONLY: 'view-only',
  ACKNOWLEDGE: 'acknowledge',
  YES_NO: 'yes-no',
};

function mapResponseType(apiType?: string): ResponseType {
  if (!apiType) return 'view-only';
  return RESPONSE_TYPE_MAP[apiType] ?? 'view-only';
}

const PG_STATUS_MAP: Record<PGApiAnnouncementStatus, PGStatus> = {
  POSTED: 'posted',
  SCHEDULED: 'scheduled',
  POSTING: 'posting',
  DRAFT: 'draft',
};

function toPGStatus(raw: PGApiAnnouncementStatus): PGStatus {
  return PG_STATUS_MAP[raw] ?? 'draft';
}

/**
 * Extract plain text from a Tiptap doc.
 * PG sends it as a parsed object; legacy fixtures may send a JSON string.
 */
function extractTextFromTiptap(rich: Record<string, unknown> | string | null | undefined): string {
  if (rich == null) return '';
  if (typeof rich === 'string') {
    try {
      return extractText(JSON.parse(rich) as TiptapNode).trim();
    } catch {
      return rich.trim();
    }
  }
  return extractText(rich).trim();
}

interface TiptapNode {
  type?: string;
  content?: TiptapNode[];
  text?: string;
}

function extractText(node: TiptapNode): string {
  if (typeof node.text === 'string') return node.text;
  if (!Array.isArray(node.content)) return '';

  const parts = node.content.map(extractText);
  return node.type === 'doc' ? parts.join('\n') : parts.join('');
}

// ─── Outbound: FE payload → pgw-web schema ──────────────────────────────────
// FE collects recipients grouped (classIds / customGroupIds / ccaIds / levelIds)
// because that's what the form needs; pgw-web's API takes them as a flat
// `targets` array. Other field renames mirror the read-side envelope fix.

type PGTargetType = 'class' | 'group' | 'cca' | 'level';

interface PGWritePayload {
  title: string;
  content: string;
  enquiryEmailAddress: string;
  targets: { targetType: PGTargetType; targetId: number }[];
  staffInCharge?: number[];
  webLinkList?: { webLink: string; linkDescription: string }[];
}

export function toPGCreatePayload(p: PGApiCreateAnnouncementPayload): PGWritePayload {
  if (!p.enquiryEmailAddress) {
    throw new Error('enquiryEmailAddress is required');
  }
  const targets: PGWritePayload['targets'] = [
    ...p.recipients.classIds.map((targetId) => ({ targetType: 'class' as const, targetId })),
    ...p.recipients.customGroupIds.map((targetId) => ({ targetType: 'group' as const, targetId })),
    ...p.recipients.ccaIds.map((targetId) => ({ targetType: 'cca' as const, targetId })),
    ...p.recipients.levelIds.map((targetId) => ({ targetType: 'level' as const, targetId })),
  ];
  return {
    title: p.title,
    content: p.richTextContent,
    enquiryEmailAddress: p.enquiryEmailAddress,
    targets,
    staffInCharge: p.staffOwnerIds,
    webLinkList: p.websiteLinks?.map((l) => ({ webLink: l.url, linkDescription: l.title })),
  };
}
