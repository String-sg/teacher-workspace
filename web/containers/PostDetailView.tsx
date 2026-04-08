import React from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { Typography } from '@flow/core';
import { ArrowLeft } from '@flow/icons';

import { Button, Separator } from '~/components/ui';
import { StatusBadge } from '~/components/comms/StatusBadge';
import { ReadTrackingCards } from '~/components/comms/ReadTrackingCards';
import { RecipientReadTable } from '~/components/comms/RecipientReadTable';
import { getPGAnnouncementById } from '~/data/mock-pg-announcements';
import { formatDate } from '~/helpers/dateTime';

const PostDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const announcement = id ? getPGAnnouncementById(id) : undefined;

  if (!id || !announcement) {
    return <Navigate to="/posts" replace />;
  }

  // Sort recipients: unread first
  const sortedRecipients = [...announcement.recipients].sort((a, b) => {
    if (a.readStatus === 'unread' && b.readStatus === 'read') return -1;
    if (a.readStatus === 'read' && b.readStatus === 'unread') return 1;
    return 0;
  });

  return (
    <div className="px-6 py-6 max-w-4xl space-y-8">
      {/* Header: Back + Edit */}
      <div className="flex items-center justify-between">
        <Link
          to="/posts"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Posts
        </Link>

        <Button variant="outline" size="sm" asChild>
          <Link to={`/posts/${id}/edit`}>Edit</Link>
        </Button>
      </div>

      {/* Post content */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <StatusBadge status={announcement.status} />
          <Typography variant="title-lg" asChild>
            <h1>{announcement.title}</h1>
          </Typography>
        </div>

        <Typography variant="body-sm" className="text-muted-foreground" asChild>
          <p>
            Posted on:{' '}
            {formatDate(announcement.postedAt ?? announcement.createdAt)}
          </p>
        </Typography>

        <Typography variant="body-md" className="mt-4" asChild>
          <p>{announcement.description}</p>
        </Typography>
      </div>

      <Separator />

      {/* Read tracking */}
      <div className="space-y-4">
        <Typography variant="label-lg-strong">Read Tracking</Typography>
        <ReadTrackingCards
          responseType={announcement.responseType}
          stats={announcement.stats}
        />
      </div>

      <Separator />

      {/* Recipients table */}
      <div className="space-y-4">
        <Typography variant="label-lg-strong">Recipients</Typography>
        <RecipientReadTable
          recipients={sortedRecipients}
          responseType={announcement.responseType}
        />
      </div>
    </div>
  );
};

export { PostDetailView as Component };
