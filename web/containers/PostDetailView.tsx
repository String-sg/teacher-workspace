import { Typography } from '@flow/core';
import { ArrowLeft } from '@flow/icons';
import React, { useMemo } from 'react';
import type { LoaderFunctionArgs } from 'react-router';
import { isRouteErrorResponse, Link, useLoaderData, useParams, useRouteError } from 'react-router';

import { loadPostDetail } from '~/api/client';
import { AnnouncementCard } from '~/components/posts/AnnouncementCard';
import { ReadTrackingCards } from '~/components/posts/ReadTrackingCards';
import { RecipientReadTable } from '~/components/posts/RecipientReadTable';
import { StatusBadge } from '~/components/posts/StatusBadge';
import { Button } from '~/components/ui';
import type { PGAnnouncement } from '~/data/mock-pg-announcements';
import { formatDate } from '~/helpers/dateTime';

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
      <Typography variant="title-md">
        {isRouteErrorResponse(error) && error.status === 404
          ? 'Post not found'
          : 'Could not load post'}
      </Typography>
      <Typography variant="body-sm" className="text-muted-foreground">
        {isRouteErrorResponse(error) && error.status === 404
          ? 'This post may have been deleted.'
          : 'The server may be unavailable. Please try again.'}
      </Typography>
      <Button variant="outline" size="sm" render={<Link to="/posts" />} nativeButton={false}>
        Back to Posts
      </Button>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

const PostDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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

  return (
    <div className="space-y-6 px-6 py-6">
      {/* Header: Back + Edit */}
      <div className="flex items-center justify-between">
        <Link
          to="/posts"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Posts
        </Link>

        <Button
          variant="outline"
          size="sm"
          render={<Link to={`/posts/${id}/edit`} />}
          nativeButton={false}
        >
          Edit
        </Button>
      </div>

      {/* Post title + status + date */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <StatusBadge status={announcement.status} />
          <Typography variant="title-lg" asChild>
            <h1>{announcement.title}</h1>
          </Typography>
        </div>

        <Typography variant="body-sm" className="text-muted-foreground" asChild>
          <p>Posted on: {formatDate(announcement.postedAt ?? announcement.createdAt)}</p>
        </Typography>
      </div>

      {/* Two-column grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Read tracking cards */}
          <div className="space-y-3">
            <Typography
              variant="label-sm"
              className="tracking-widest text-muted-foreground uppercase"
            >
              {announcement.responseType === 'view-only' ? 'READ STATUS' : 'RESPONSES RECEIVED'}
            </Typography>
            <ReadTrackingCards
              responseType={announcement.responseType}
              stats={announcement.stats}
            />
          </div>

          {/* Recipients table */}
          <div className="space-y-3">
            <Typography
              variant="label-sm"
              className="tracking-widest text-muted-foreground uppercase"
            >
              RESPONSE STATUS
            </Typography>
            <RecipientReadTable
              recipients={sortedRecipients}
              responseType={announcement.responseType}
            />
          </div>
        </div>

        {/* Right column (1/3) */}
        <div>
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
