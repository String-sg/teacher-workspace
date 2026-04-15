import type { PGAnnouncement } from '~/data/mock-pg-announcements';

import detailFixture from '../../server/internal/pg/fixtures/announcement_detail.json';
import announcementsFixture from '../../server/internal/pg/fixtures/announcements.json';
import sharedFixture from '../../server/internal/pg/fixtures/announcements_shared.json';
import consentFormsFixture from '../../server/internal/pg/fixtures/consent_forms.json';
import {
  mapAnnouncementDetail,
  mapAnnouncementSummary,
  mapConsentFormSummary,
  mergeAndDedup,
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
  PGApiSchoolGroups,
  PGApiSchoolStaffList,
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

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Response('API error', { status: res.status });
  }
  return unwrapEnvelope<T>(await res.json());
}

async function mutateApi<T>(method: 'POST' | 'PUT', path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Response('API error', { status: res.status });
  }
  // Handle empty responses (204 No Content or empty body)
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return unwrapEnvelope<T>(JSON.parse(text));
}

async function deleteApi(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Response('API error', { status: res.status });
  }
}

/** Returns fallback on network errors; re-throws HTTP and abort errors. */
async function fetchApiSafe<T>(path: string, fallback: T): Promise<T> {
  try {
    return await fetchApi<T>(path);
  } catch (err) {
    // Re-throw AbortError so React Router's navigation cancellation works
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    // Re-throw HTTP errors so they surface to error boundaries
    if (err instanceof Response) throw err;
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

function fetchAnnouncementDetail(postId: string) {
  return fetchApiSafe<PGApiAnnouncementDetail>(
    `/announcements/${postId}`,
    detailFixture as unknown as PGApiAnnouncementDetail,
  );
}

// ─── Write ──────────────────────────────────────────────────────────────────

/** Create and immediately send an announcement. */
export function createAnnouncement(payload: PGApiCreateAnnouncementPayload) {
  return mutateApi<{ postId: number }>('POST', '/announcements', payload);
}

/** Save an announcement as draft. */
export function createDraft(payload: PGApiCreateDraftPayload) {
  return mutateApi<{ announcementDraftId: number }>('POST', '/announcements/drafts', payload);
}

/** Schedule a draft for future sending. */
export function scheduleDraft(payload: PGApiScheduleDraftPayload) {
  return mutateApi<void>('POST', '/announcements/drafts/schedule', payload);
}

/** Update an existing draft. */
export function updateDraft(draftId: number, payload: PGApiCreateDraftPayload) {
  return mutateApi<void>('PUT', `/announcements/drafts/${draftId}`, payload);
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

export async function fetchSchoolStaff() {
  const data = await fetchApi<PGApiSchoolStaffList>('/school/staff');
  return data.staff;
}

export function fetchSchoolGroups() {
  return fetchApi<PGApiSchoolGroups>('/school/groups');
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
