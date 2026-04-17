import { Progress } from '~/components/ui';
import { cn } from '~/lib/utils';

interface ReadRateProps {
  readCount: number;
  totalCount: number;
  className?: string;
}

export function ReadRate({ readCount, totalCount, className }: ReadRateProps) {
  if (totalCount === 0) {
    return <span className="text-sm text-muted-foreground">{'\u2014'}</span>;
  }

  const percent = (readCount / totalCount) * 100;

  return (
    <div className={cn('flex w-[140px] items-center gap-2', className)}>
      <Progress value={percent} className="flex-1" aria-label="Read progress" />
      <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
        {readCount} / {totalCount}
      </span>
    </div>
  );
}
