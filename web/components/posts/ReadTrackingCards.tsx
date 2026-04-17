import { MessageSquareText, Users } from 'lucide-react';
import { memo } from 'react';

import { Card, CardContent, Progress } from '~/components/ui';
import type { PGAnnouncementStats, ResponseType } from '~/data/mock-pg-announcements';

interface ReadTrackingCardsProps {
  responseType: ResponseType;
  stats: PGAnnouncementStats;
}

interface StatCardProps {
  label: string;
  count: number;
  total: number;
  icon: React.ReactNode;
  subline?: React.ReactNode;
}

const StatCard = memo(function StatCard({ label, count, total, icon, subline }: StatCardProps) {
  const percent = total > 0 ? (count / total) * 100 : 0;

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              {label}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl leading-none font-semibold tabular-nums">{count}</span>
              <span className="text-base text-muted-foreground tabular-nums">/ {total}</span>
            </div>
            {subline}
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-twblue-3 text-twblue-9">
            {icon}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Progress value={percent} className="flex-1" aria-label={`${label} progress`} />
          <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
            {count} / {total}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});

export function ReadTrackingCards({ responseType, stats }: ReadTrackingCardsProps) {
  const { totalCount, readCount, responseCount, yesCount, noCount } = stats;
  const unreadCount = Math.max(totalCount - readCount, 0);

  const readSubline =
    unreadCount > 0 ? (
      <span className="text-sm font-medium text-amber-10">{unreadCount} unread</span>
    ) : null;

  const readCard = (
    <StatCard
      label="Read by parents"
      count={readCount}
      total={totalCount}
      icon={<Users className="h-5 w-5" />}
      subline={readSubline}
    />
  );

  if (responseType === 'view-only') {
    return readCard;
  }

  const responseLabel = responseType === 'acknowledge' ? 'Acknowledged' : 'Responses received';
  const responseSubline =
    responseType === 'yes-no' && totalCount > 0 ? (
      <span className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{yesCount}</span> yes ·{' '}
        <span className="font-medium text-foreground">{noCount}</span> no
      </span>
    ) : null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {readCard}
      <StatCard
        label={responseLabel}
        count={responseCount}
        total={totalCount}
        icon={<MessageSquareText className="h-5 w-5" />}
        subline={responseSubline}
      />
    </div>
  );
}
