import { Badge } from '~/components/ui';
import type { PGStatus } from '~/data/mock-pg-announcements';
import { cn } from '~/lib/utils';

const STATUS_CONFIG: Record<PGStatus, { label: string; className: string }> = {
  posted: {
    label: 'Posted',
    className: 'bg-green-3 text-green-11 hover:bg-green-3',
  },
  scheduled: {
    label: 'Scheduled',
    className: 'bg-blue-3 text-blue-11 hover:bg-blue-3',
  },
  posting: {
    label: 'Posting',
    className: 'bg-blue-3 text-blue-11 hover:bg-blue-3',
  },
  draft: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground hover:bg-muted',
  },
};

const FALLBACK = STATUS_CONFIG.draft;

interface StatusBadgeProps {
  status: PGStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? FALLBACK;
  return <Badge className={cn(config.className, className)}>{config.label}</Badge>;
}
