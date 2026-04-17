import { Badge } from '~/components/ui';
import type { PGStatus } from '~/data/mock-pg-announcements';
import { cn } from '~/lib/utils';

const STATUS_CONFIG: Record<PGStatus, { label: string; className: string }> = {
  posted: {
    label: 'Posted',
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
  },
  scheduled: {
    label: 'Scheduled',
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  },
  posting: {
    label: 'Posting',
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  },
  draft: {
    label: 'Draft',
    className: 'bg-slate-100 text-slate-600 hover:bg-slate-100',
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
