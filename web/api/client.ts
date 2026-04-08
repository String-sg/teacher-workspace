import type { PGAnnouncement } from '~/data/mock-pg-announcements';

import {
  mapAnnouncementDetail,
  mapAnnouncementSummary,
  mapConsentFormSummary,
  mergeAndDedup,
} from './mappers';
import announcementsFixture from '../../server/internal/pg/fixtures/announcements.json';
import sharedFixture from '../../server/internal/pg/fixtures/announcements_shared.json';
import detailFixture from '../../server/internal/pg/fixtures/announcement_detail.json';
import readStatusFixture from '../../server/internal/pg/fixtures/announcement_read_status.json';
import consentFormsFixture from '../../server/internal/pg/fixtures/consent_forms.json';
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
  PGApiReadStatus,
  PGApiScheduleDraftPayload,
  PGApiSchoolGroups,
  PGApiSchoolStaff,
  PGApiSession,
  PGApiUserProfile,
} from './types';

const API_BASE = '/api/web/2/staff';

// ─── Fetch helpers ──────────────────────────────────────────────────────────

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Response('API error', { status: res.status });
  }
  return res.json() as Promise<T>;
}

async function postApi<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Response('API error', { status: res.status });
  }
  return res.json() as Promise<T>;
}

async function putApi<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Response('API error', { status: res.status });
  }
  return res.json() as Promise<T>;
}

async function deleteApi(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Response('API error', { status: res.status });
  }
}

/** Returns fallback instead of crashing when the API is unavailable. */
async function fetchApiSafe<T>(path: string, fallback: T): Promise<T> {
  try {
    return await fetchApi<T>(path);
  } catch {
    console.warn(`[PG API] Failed to fetch ${path}, using fixture fallback`);
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

function fetchAnnouncementReadStatus(postId: string) {
  return fetchApiSafe<PGApiReadStatus>(
    `/announcements/${postId}/readStatus`,
    readStatusFixture as unknown as PGApiReadStatus,
  );
}

// ─── Write ──────────────────────────────────────────────────────────────────

/** Create and immediately send an announcement. */
export function createAnnouncement(payload: PGApiCreateAnnouncementPayload) {
  return postApi<{ postId: number }>('/announcements', payload);
}

/** Save an announcement as draft. */
export function createDraft(payload: PGApiCreateDraftPayload) {
  return postApi<{ announcementDraftId: number }>('/announcements/drafts', payload);
}

/** Schedule a draft for future sending. */
export function scheduleDraft(payload: PGApiScheduleDraftPayload) {
  return postApi<void>('/announcements/drafts/schedule', payload);
}

/** Update an existing draft. */
export function updateDraft(draftId: number, payload: PGApiCreateDraftPayload) {
  return putApi<void>(`/announcements/drafts/${draftId}`, payload);
}

/** Duplicate an existing announcement. */
export function duplicateAnnouncement(payload: PGApiDuplicatePayload) {
  return postApi<{ postId: number }>('/announcements/duplicate', payload);
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
  const [own, shared] = await Promise.all([
    fetchAnnouncements(),
    fetchSharedAnnouncements(),
  ]);
  const mappedOwn = own.posts.map((p) => mapAnnouncementSummary(p, 'mine'));
  const mappedShared = shared.posts.map((p) =>
    mapAnnouncementSummary(p, 'shared'),
  );
  return mergeAndDedup(mappedOwn, mappedShared);
}

export async function loadPostDetail(
  postId: string,
): Promise<PGAnnouncement | null> {
  try {
    const [detail, readStatus] = await Promise.all([
      fetchAnnouncementDetail(postId),
      fetchAnnouncementReadStatus(postId),
    ]);
    return mapAnnouncementDetail(detail, readStatus);
  } catch {
    console.warn(`[PG API] Failed to load post ${postId}`);
    return null;
  }
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
  return postApi<{ consentFormId: number }>('/consentForms', payload);
}

export function createConsentFormDraft(payload: unknown) {
  return postApi<{ consentFormDraftId: number }>('/consentForms/drafts', payload);
}

export function updateConsentFormDraft(draftId: number, payload: unknown) {
  return putApi<void>(`/consentForms/drafts/${draftId}`, payload);
}

export function updateConsentFormDueDate(formId: number, payload: { consentByDate: string }) {
  return putApi<void>(`/consentForms/${formId}/updateDueDate`, payload);
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
  const [own, shared] = await Promise.all([
    fetchConsentForms(),
    fetchSharedConsentForms(),
  ]);
  const mappedOwn = own.posts.map((p) => mapConsentFormSummary(p, 'mine'));
  const mappedShared = shared.posts.map((p) => mapConsentFormSummary(p, 'shared'));
  const ownIds = new Set(mappedOwn.map((f) => f.id));
  return [...mappedOwn, ...mappedShared.filter((f) => !ownIds.has(f.id))];
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHOOL DATA (for selectors and forms)
// ═══════════════════════════════════════════════════════════════════════════

export function fetchSchoolStaff() {
  return fetchApi<PGApiSchoolStaff[]>('/school/staff');
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
  return putApi<void>(`/${staffId}/updateDisplayName`, { displayName });
}

export function updateDisplayEmail(staffId: number, displayEmail: string) {
  return putApi<void>(`/${staffId}/updateDisplayEmail`, { displayEmail });
}
