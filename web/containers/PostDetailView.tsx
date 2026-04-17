import { ArrowLeft } from 'lucide-react';
import React, { useMemo } from 'react';
import type { LoaderFunctionArgs } from 'react-router';
import { isRouteErrorResponse, Link, useLoaderData, useRouteError } from 'react-router';

import { loadPostDetail } from '~/api/client';
import { AnnouncementCard } from '~/components/posts/AnnouncementCard';
import { ReadTrackingCards } from '~/components/posts/ReadTrackingCards';
import { RecipientReadTable } from '~/components/posts/RecipientReadTable';
import { StatusBadge } from '~/components/posts/StatusBadge';
import { Button } from '~/components/ui';
import type { PGAnnouncement } from '~/data/mock-pg-announcements';
import { formatDate, formatDateTime } from '~/helpers/dateTime';

// ─── Route loader ───────────────────────────────────────────────────────────

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.id;
  if (!id) throw new Response('Not Found', { status: 404 });
  return loadPostDetail(id);
}

// ─── Error boundary ─────────────────────────────────────────────────────────

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16">
      <h2 className="text-xl font-semibold tracking-tight">
        {isRouteErrorResponse(error) && error.status === 404
          ? 'Post not found'
          : 'Could not load post'}
      </h2>
      <p className="text-sm text-muted-foreground">
        {isRouteErrorResponse(error) && error.status === 404
          ? 'This post may have been deleted.'
          : 'The server may be unavailable. Please try again.'}
      </p>
      <Button variant="outline" size="sm" render={<Link to="/posts" />} nativeButton={false}>
        Back to Posts
      </Button>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

const PostDetailView: React.FC = () => {
  const announcement = useLoaderData<PGAnnouncement>();

  const sortedRecipients = useMemo(
    () =>
      [...announcement.recipients].sort((a, b) => {
        if (a.readStatus === 'unread' && b.readStatus === 'read') return -1;
        if (a.readStatus === 'read' && b.readStatus === 'unread') return 1;
        return 0;
      }),
    [announcement],
  );

  const iso = announcement.postedAt ?? announcement.createdAt;
  const postedDate = formatDateTime(iso) ?? formatDate(iso);

  return (
    <div className="space-y-6 px-6 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            render={<Link to="/posts" />}
            nativeButton={false}
            aria-label="Back to Posts"
            className="mt-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{announcement.title}</h1>
              <StatusBadge status={announcement.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Posted {postedDate}
              {announcement.createdBy ? ` · ${announcement.createdBy}` : ''}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          render={<Link to={`/posts/${announcement.id}/edit`} />}
          nativeButton={false}
        >
          Edit
        </Button>
      </div>

      {/* Two-column grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          <ReadTrackingCards responseType={announcement.responseType} stats={announcement.stats} />

          <RecipientReadTable
            recipients={sortedRecipients}
            responseType={announcement.responseType}
          />
        </div>

        {/* Right column (1/3) */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <AnnouncementCard
            title={announcement.title}
            description={announcement.description}
            enquiryEmail={announcement.enquiryEmail}
            staffInCharge={announcement.staffInCharge}
          />
        </div>
      </div>
    </div>
  );
};

export { PostDetailView as Component };
