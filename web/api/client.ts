import type { PGAnnouncement } from '~/data/mock-pg-announcements';

import {
  mapAnnouncementDetail,
  mapAnnouncementSummary,
  mergeAndDedup,
} from './mappers';
import announcementsFixture from '../../server/internal/pg/fixtures/announcements.json';
import sharedFixture from '../../server/internal/pg/fixtures/announcements_shared.json';
import detailFixture from '../../server/internal/pg/fixtures/announcement_detail.json';
import readStatusFixture from '../../server/internal/pg/fixtures/announcement_read_status.json';
import type {
  PGApiAnnouncementDetail,
  PGApiAnnouncementList,
  PGApiReadStatus,
} from './types';

const API_BASE = '/api/web/2/staff';

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Response('API error', { status: res.status });
  }
  return res.json() as Promise<T>;
}

/** Wrapper that returns a fallback instead of crashing when the API is unavailable. */
async function fetchApiSafe<T>(path: string, fallback: T): Promise<T> {
  try {
    return await fetchApi<T>(path);
  } catch {
    console.warn(`[PG API] Failed to fetch ${path}, using fixture fallback`);
    return fallback;
  }
}

// ─── Raw fetch functions (fall back to embedded fixtures when API unavailable)

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

// ─── Composed loaders (called by route loaders, return mapped FE types) ─────

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
