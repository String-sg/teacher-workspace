export type PGStatus = 'posted' | 'scheduled' | 'draft';
export type ResponseType = 'view-only' | 'acknowledge' | 'yes-no';

export type ResponseTypeWithResponse = 'acknowledge' | 'yes-no';

export function requiresResponse(
  rt: ResponseType,
): rt is ResponseTypeWithResponse {
  return rt === 'acknowledge' || rt === 'yes-no';
}
export type PGOwnership = 'mine' | 'shared';

export interface PGRecipient {
  studentId: string;
  studentName: string;
  classId: string;
  parentName: string;
  readStatus: 'read' | 'unread';
  respondedAt?: string;
  formResponse?: 'yes' | 'no';
}

export interface PGAnnouncementStats {
  totalCount: number;
  readCount: number;
  responseCount: number;
  yesCount: number;
  noCount: number;
}

export interface PGAnnouncement {
  id: string;
  title: string;
  description: string;
  status: PGStatus;
  responseType: ResponseType;
  ownership: PGOwnership;
  role?: 'owner' | 'viewer';
  recipients: PGRecipient[];
  stats: PGAnnouncementStats;
  postedAt?: string;
  scheduledAt?: string;
  createdAt: string;
  createdBy: string;
}

export const mockPGAnnouncements: PGAnnouncement[] = [
  {
    id: '1',
    title: 'Term 4 Letter to Parents',
    description:
      'Dear parents, please find attached the letter regarding Term 4 arrangements including exam schedules and upcoming school events.',
    status: 'posted',
    responseType: 'view-only',
    ownership: 'mine',
    postedAt: '2026-03-10T09:00:00+08:00',
    createdAt: '2026-03-09T14:30:00+08:00',
    createdBy: 'Ms Tan Wei Ling',
    stats: { totalCount: 4, readCount: 2, responseCount: 0, yesCount: 0, noCount: 0 },
    recipients: [
      {
        studentId: 'S001',
        studentName: 'Alice Tan',
        classId: '4A',
        parentName: 'Mr Tan Ah Kow',
        readStatus: 'read',
      },
      {
        studentId: 'S002',
        studentName: 'Bob Lim',
        classId: '4A',
        parentName: 'Mrs Lim Mei Hua',
        readStatus: 'read',
      },
      {
        studentId: 'S003',
        studentName: 'Carol Chen',
        classId: '4A',
        parentName: 'Mr Chen Wei',
        readStatus: 'unread',
      },
      {
        studentId: 'S004',
        studentName: 'David Ng',
        classId: '4A',
        parentName: 'Mrs Ng Li Fang',
        readStatus: 'unread',
      },
    ],
  },
  {
    id: '2',
    title: 'Class Chalet 2026 – RSVP',
    description:
      'We are organising a class chalet on 15-16 June 2026 at Costa Sands Resort. Please indicate if your child will be attending.',
    status: 'posted',
    responseType: 'yes-no',
    ownership: 'shared',
    role: 'owner',
    postedAt: '2026-03-12T10:00:00+08:00',
    createdAt: '2026-03-11T16:00:00+08:00',
    createdBy: 'Mr Ahmad Bin Ibrahim',
    stats: { totalCount: 3, readCount: 2, responseCount: 2, yesCount: 1, noCount: 1 },
    recipients: [
      {
        studentId: 'S001',
        studentName: 'Alice Tan',
        classId: '4A',
        parentName: 'Mr Tan Ah Kow',
        readStatus: 'read',
        respondedAt: '2026-03-12T12:30:00+08:00',
        formResponse: 'yes',
      },
      {
        studentId: 'S002',
        studentName: 'Bob Lim',
        classId: '4A',
        parentName: 'Mrs Lim Mei Hua',
        readStatus: 'read',
        respondedAt: '2026-03-13T08:00:00+08:00',
        formResponse: 'no',
      },
      {
        studentId: 'S005',
        studentName: 'Emily Wong',
        classId: '4A',
        parentName: 'Mrs Wong Siew Lan',
        readStatus: 'unread',
      },
    ],
  },
  {
    id: '3',
    title: 'Science Centre Learning Journey',
    description:
      'Your child has been selected for the Science Centre Learning Journey on 20 April 2026. Please acknowledge receipt of this notification.',
    status: 'scheduled',
    responseType: 'acknowledge',
    ownership: 'mine',
    scheduledAt: '2026-04-05T08:00:00+08:00',
    createdAt: '2026-03-20T11:00:00+08:00',
    createdBy: 'Ms Tan Wei Ling',
    stats: { totalCount: 3, readCount: 0, responseCount: 0, yesCount: 0, noCount: 0 },
    recipients: [
      {
        studentId: 'S001',
        studentName: 'Alice Tan',
        classId: '4A',
        parentName: 'Mr Tan Ah Kow',
        readStatus: 'unread',
      },
      {
        studentId: 'S003',
        studentName: 'Carol Chen',
        classId: '4A',
        parentName: 'Mr Chen Wei',
        readStatus: 'unread',
      },
      {
        studentId: 'S005',
        studentName: 'Emily Wong',
        classId: '4A',
        parentName: 'Mrs Wong Siew Lan',
        readStatus: 'unread',
      },
    ],
  },
];
