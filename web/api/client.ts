import type { PGAnnouncement } from '~/data/mock-pg-announcements';
import { notify } from '~/lib/notify';

import detailFixture from '../../server/internal/pg/fixtures/announcement_detail.json';
import announcementsFixture from '../../server/internal/pg/fixtures/announcements.json';
import sharedFixture from '../../server/internal/pg/fixtures/announcements_shared.json';
import consentFormsFixture from '../../server/internal/pg/fixtures/consent_forms.json';
import { PGError, PGNotFoundError, PGSessionExpiredError, PGValidationError } from './errors';
import {
  mapAnnouncementDetail,
  mapAnnouncementSummary,
  mapConsentFormSummary,
  mergeAndDedup,
  toPGCreatePayload,
} from './mappers';
import type {
  PGApiAnnouncementDetail,
  PGApiAnnouncementList,
  PGApiClassDetail,
  PGApiConsentFormDetail,
  PGApiConsentFormList,
  PGApiConsentFormSummary,
  PGApiCreateAnnouncementPayload,
  PGApiCreateDraftPayload,
  PGApiDuplicatePayload,
  PGApiGroupsAssigned,
  PGApiScheduleDraftPayload,
  PGApiSchoolClass,
  PGApiSchoolGroups,
  PGApiSchoolStaffList,
  PGApiSchoolStudent,
  PGApiSession,
  PGApiUserProfile,
} from './types';

const API_BASE = '/api/web/2/staff';

// ─── Fetch helpers ──────────────────────────────────────────────────────────

// Real pgw-web wraps all responses as {body, resultCode, message, metadata};
// mock fixtures are raw. Detect the envelope by requiring both `body` and a
// numeric `resultCode` — no TW inner shape uses resultCode, so false positives
// are effectively impossible.
function unwrapEnvelope<T>(json: unknown): T {
  if (
    json !== null &&
    typeof json === 'object' &&
    'body' in json &&
    'resultCode' in json &&
    typeof (json as { resultCode: unknown }).resultCode === 'number'
  ) {
    return (json as { body: T }).body;
  }
  return json as T;
}

// Translates pgw's error envelope into a typed `PGError` subclass and applies
// side-effects (redirect for session loss, toast for generic failures) before
// rethrowing. Validation errors are thrown silently so containers can render
// them inline rather than as toasts.
async function handleErrorResponse(res: Response): Promise<never> {
  let resultCode: number | undefined;
  let errorReason: string | undefined;
  try {
    const body = (await res.clone().json()) as {
      resultCode?: number;
      message?: string;
      error?: { errorReason?: string };
    };
    resultCode = body.resultCode;
    errorReason = body.error?.errorReason ?? body.message;
  } catch {
    // Non-JSON body (e.g. HTML error page) — fall through with undefined fields.
  }

  const message = errorReason ?? `Request failed (${res.status}).`;
  const code = resultCode ?? res.status;

  switch (resultCode) {
    case -401:
    case -4012:
      if (typeof window !== 'undefined' && window.location.pathname !== '/session-expired') {
        window.location.href = '/session-expired';
      }
      throw new PGSessionExpiredError(message, code, res.status);
    case -404:
      throw new PGNotFoundError(message, code, res.status);
    case -400:
    case -4001:
    case -4003:
    case -4004:
      throw new PGValidationError(message, code, res.status);
    case -429:
      notify.error('Too many requests. Please slow down and try again.');
      throw new PGError(message, code, res.status);
    default:
      notify.error(message);
      throw new PGError(message, code, res.status);
  }
}

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) await handleErrorResponse(res);
  return unwrapEnvelope<T>(await res.json());
}

async function mutateApi<T>(method: 'POST' | 'PUT', path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) await handleErrorResponse(res);
  // Handle empty responses (204 No Content or empty body)
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return unwrapEnvelope<T>(JSON.parse(text));
}

async function deleteApi(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) await handleErrorResponse(res);
}

/** Returns fallback on network errors; re-throws HTTP and abort errors. */
async function fetchApiSafe<T>(path: string, fallback: T): Promise<T> {
  try {
    return await fetchApi<T>(path);
  } catch (err) {
    // Re-throw AbortError so React Router's navigation cancellation works
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    // Re-throw HTTP errors so they surface to error boundaries / containers
    if (err instanceof PGError) throw err;
    // Only fall back for network-level failures (server unreachable)
    console.warn(`[PG API] Network error fetching ${path}, using fixture fallback`);
    return fallback;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════════════════════════

// ─── Read ───────────────────────────────────────────────────────────────────

function fetchAnnouncements() {
  return fetchApiSafe<PGApiAnnouncementList>(
    '/announcements',
    announcementsFixture as unknown as PGApiAnnouncementList,
  );
}

function fetchSharedAnnouncements() {
  return fetchApiSafe<PGApiAnnouncementList>(
    '/announcements/shared',
    sharedFixture as unknown as PGApiAnnouncementList,
  );
}

async function fetchAnnouncementDetail(postId: string): Promise<PGApiAnnouncementDetail> {
  // pgw-web wraps single-detail responses as `body: [<detail>]`; unwrap the array.
  // Fixture mirrors that shape so mock mode stays in lockstep.
  const arr = await fetchApiSafe<PGApiAnnouncementDetail[]>(
    `/announcements/${postId}`,
    detailFixture as unknown as PGApiAnnouncementDetail[],
  );
  return arr[0];
}

// ─── Write ──────────────────────────────────────────────────────────────────

/** Create and immediately send an announcement. */
export function createAnnouncement(payload: PGApiCreateAnnouncementPayload) {
  return mutateApi<{ postId: number }>('POST', '/announcements', toPGCreatePayload(payload));
}

/** Save an announcement as draft. */
export function createDraft(payload: PGApiCreateDraftPayload) {
  const body = { ...toPGCreatePayload(payload), scheduledSendAt: payload.scheduledSendAt };
  return mutateApi<{ announcementDraftId: number }>('POST', '/announcements/drafts', body);
}

/** Schedule a draft for future sending. */
export function scheduleDraft(payload: PGApiScheduleDraftPayload) {
  return mutateApi<void>('POST', '/announcements/drafts/schedule', payload);
}

/** Update an existing draft. */
export function updateDraft(draftId: number, payload: PGApiCreateDraftPayload) {
  const body = { ...toPGCreatePayload(payload), scheduledSendAt: payload.scheduledSendAt };
  return mutateApi<void>('PUT', `/announcements/drafts/${draftId}`, body);
}

/** Duplicate an existing announcement. */
export function duplicateAnnouncement(payload: PGApiDuplicatePayload) {
  return mutateApi<{ postId: number }>('POST', '/announcements/duplicate', payload);
}

/** Delete a posted announcement. */
export function deleteAnnouncement(postId: string) {
  return deleteApi(`/announcements/${postId}`);
}

/** Delete a draft announcement. */
export function deleteDraft(draftId: number) {
  return deleteApi(`/announcements/drafts/${draftId}`);
}

// ─── Composed loaders ───────────────────────────────────────────────────────

export async function loadPostsList(): Promise<PGAnnouncement[]> {
  const [own, shared] = await Promise.all([fetchAnnouncements(), fetchSharedAnnouncements()]);
  const mappedOwn = own.map((p) => mapAnnouncementSummary(p, 'mine'));
  const mappedShared = shared.map((p) => mapAnnouncementSummary(p, 'shared'));
  return mergeAndDedup(mappedOwn, mappedShared);
}

export async function loadPostDetail(postId: string): Promise<PGAnnouncement> {
  const detail = await fetchAnnouncementDetail(postId);
  return mapAnnouncementDetail(detail);
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSENT FORMS
// ═══════════════════════════════════════════════════════════════════════════

// ─── Read ───────────────────────────────────────────────────────────────────

function fetchConsentForms() {
  return fetchApiSafe<PGApiConsentFormList>(
    '/consentForms',
    consentFormsFixture as unknown as PGApiConsentFormList,
  );
}

function fetchSharedConsentForms() {
  return fetchApiSafe<PGApiConsentFormList>(
    '/consentForms/shared',
    consentFormsFixture as unknown as PGApiConsentFormList,
  );
}

export function fetchConsentFormDetail(formId: string) {
  return fetchApi<PGApiConsentFormDetail>(`/consentForms/${formId}`);
}

// ─── Write ──────────────────────────────────────────────────────────────────

export function createConsentForm(payload: unknown) {
  return mutateApi<{ consentFormId: number }>('POST', '/consentForms', payload);
}

export function createConsentFormDraft(payload: unknown) {
  return mutateApi<{ consentFormDraftId: number }>('POST', '/consentForms/drafts', payload);
}

export function updateConsentFormDraft(draftId: number, payload: unknown) {
  return mutateApi<void>('PUT', `/consentForms/drafts/${draftId}`, payload);
}

export function updateConsentFormDueDate(formId: number, payload: { consentByDate: string }) {
  return mutateApi<void>('PUT', `/consentForms/${formId}/updateDueDate`, payload);
}

export function deleteConsentForm(formId: string) {
  return deleteApi(`/consentForms/${formId}`);
}

export function deleteConsentFormDraft(draftId: number) {
  return deleteApi(`/consentForms/drafts/${draftId}`);
}

// ─── Composed loaders ───────────────────────────────────────────────────────

export type ConsentFormListItem = PGApiConsentFormSummary & { ownership: 'mine' | 'shared' };

export async function loadConsentFormsList(): Promise<ConsentFormListItem[]> {
  const [own, shared] = await Promise.all([fetchConsentForms(), fetchSharedConsentForms()]);
  const mappedOwn = own.posts.map((p) => mapConsentFormSummary(p, 'mine'));
  const mappedShared = shared.posts.map((p) => mapConsentFormSummary(p, 'shared'));
  return mergeAndDedup(mappedOwn, mappedShared);
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHOOL DATA (for selectors and forms)
// ═══════════════════════════════════════════════════════════════════════════

// Local mock server and real pgw-web emit divergent shapes for school data
// (see `docs/pg-audit-findings.md` for the mismatch details). These helpers
// accept either shape and normalize to what TW's types + selectors expect,
// so callers and the form UI stay oblivious to the backend source.

interface MockSchoolStaff {
  staffId: number;
  staffName: string;
  email: string;
  assignedClass?: string | null;
}

export async function fetchSchoolStaff(): Promise<PGApiSchoolStaffList> {
  const data = await fetchApi<PGApiSchoolStaffList | { staff?: MockSchoolStaff[] }>(
    '/school/staff',
  );
  if (Array.isArray(data)) return data;
  return (data.staff ?? []).map((s) => ({
    staffId: s.staffId,
    name: s.staffName,
    email: s.email,
    className: s.assignedClass ?? null,
  }));
}

export function fetchSchoolGroups() {
  return fetchApi<PGApiSchoolGroups>('/school/groups');
}

interface MockSchoolClass {
  classId: number;
  className: string;
  level: string;
  year: number;
}

// Real pgw-web returns `body.class` (singular) as `PGApiSchoolClass[]`; the
// local mock returns `body.classes` with a raw DB-ish shape. Map the mock
// shape into the entity-selector shape so the form renders either way.
export async function fetchSchoolClasses(): Promise<PGApiSchoolClass[]> {
  const data = await fetchApi<{ class?: PGApiSchoolClass[]; classes?: MockSchoolClass[] }>(
    '/school/groups',
  );
  if (data.class) return data.class;
  return (data.classes ?? []).map((c) => ({
    type: 'class' as const,
    label: `${c.className} (${c.year})`,
    labelDescription: c.level,
    value: c.classId,
    acadYear: String(c.year),
    schoolId: 0,
  }));
}

interface MockSchoolStudent {
  studentId: number;
  studentName: string;
  className: string;
  level?: string;
  indexNumber: number;
  ccas?: string[];
}

export async function fetchSchoolStudents(): Promise<PGApiSchoolStudent[]> {
  const data = await fetchApi<PGApiSchoolStudent[] | { students?: MockSchoolStudent[] }>(
    '/school/students',
  );
  if (Array.isArray(data)) return data;
  // Mock lacks uinFinNo; surface the index number as a visible sublabel so
  // the selector still has something meaningful to render per-student.
  return (data.students ?? []).map((s) => ({
    studentId: s.studentId,
    studentName: s.studentName,
    uinFinNo: `#${s.indexNumber}`,
    classSerialNo: String(s.indexNumber),
    classCode: s.className,
    className: s.className,
    levelCode: s.level ?? '',
    levelDescription: s.level ?? '',
    cca: s.ccas ?? [],
  }));
}

export function fetchGroupsAssigned() {
  return fetchApi<PGApiGroupsAssigned>('/groups/assigned');
}

export function fetchClassDetail(classId: number) {
  return fetchApi<PGApiClassDetail>(`/groups/classes/${classId}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SESSION & ACCOUNT
// ═══════════════════════════════════════════════════════════════════════════

export function fetchSession() {
  return fetchApi<PGApiSession>('/session/current');
}

export function fetchUserProfile() {
  return fetchApi<PGApiUserProfile>('/users/me');
}

export function updateDisplayName(staffId: number, displayName: string) {
  return mutateApi<void>('PUT', `/${staffId}/updateDisplayName`, { displayName });
}

export function updateDisplayEmail(staffId: number, displayEmail: string) {
  return mutateApi<void>('PUT', `/${staffId}/updateDisplayEmail`, { displayEmail });
}
