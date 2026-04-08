import { Typography } from '@flow/core';

import { Card, CardContent, Progress } from '~/components/ui';

import type { PGAnnouncementStats, ResponseType } from '~/data/mock-pg-announcements';

interface ReadTrackingCardsProps {
  responseType: ResponseType;
  stats: PGAnnouncementStats;
}

export function ReadTrackingCards({ responseType, stats }: ReadTrackingCardsProps) {
  const { totalCount, readCount, responseCount, yesCount, noCount } = stats;
  const readPercent = totalCount > 0 ? (readCount / totalCount) * 100 : 0;
  const responsePercent = totalCount > 0 ? (responseCount / totalCount) * 100 : 0;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {/* Read card — always shown */}
      <Card>
        <CardContent className="space-y-2 p-4">
          <Typography
            variant="label-sm"
            className="uppercase tracking-wide text-muted-foreground"
          >
            Read
          </Typography>
          <Typography variant="title-md">
            {readCount} / {totalCount}
          </Typography>
          <Progress value={readPercent} />
        </CardContent>
      </Card>

      {/* Acknowledged card — acknowledge only */}
      {responseType === 'acknowledge' && (
        <Card>
          <CardContent className="space-y-2 p-4">
            <Typography
              variant="label-sm"
              className="uppercase tracking-wide text-muted-foreground"
            >
              Acknowledged
            </Typography>
            <Typography variant="title-md">
              {responseCount} / {totalCount}
            </Typography>
            <Progress value={responsePercent} />
          </CardContent>
        </Card>
      )}

      {/* Responded card — yes-no only */}
      {responseType === 'yes-no' && (
        <Card>
          <CardContent className="space-y-2 p-4">
            <Typography
              variant="label-sm"
              className="uppercase tracking-wide text-muted-foreground"
            >
              Responded
            </Typography>
            <Typography variant="title-md">
              {responseCount} / {totalCount}
            </Typography>
            <Progress value={responsePercent} />
            <Typography
              variant="label-xs"
              className="text-muted-foreground"
            >
              {yesCount} yes &middot; {noCount} no
            </Typography>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
