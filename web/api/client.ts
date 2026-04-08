import type { PGAnnouncement } from '~/data/mock-pg-announcements';

import {
  mapAnnouncementDetail,
  mapAnnouncementSummary,
  mergeAndDedup,
} from './mappers';
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
    console.warn(`[PG API] Failed to fetch ${path}, using fallback`);
    return fallback;
  }
}

// ─── Raw fetch functions ────────────────────────────────────────────────────

const EMPTY_LIST: PGApiAnnouncementList = { posts: [], total: 0, page: 1, pageSize: 10 };

function fetchAnnouncements() {
  return fetchApiSafe<PGApiAnnouncementList>('/announcements', EMPTY_LIST);
}

function fetchSharedAnnouncements() {
  return fetchApiSafe<PGApiAnnouncementList>('/announcements/shared', EMPTY_LIST);
}

function fetchAnnouncementDetail(postId: string) {
  return fetchApi<PGApiAnnouncementDetail>(`/announcements/${postId}`);
}

function fetchAnnouncementReadStatus(postId: string) {
  return fetchApi<PGApiReadStatus>(`/announcements/${postId}/readStatus`);
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
