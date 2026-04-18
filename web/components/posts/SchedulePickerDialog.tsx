import { useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';

import 'react-day-picker/style.css';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui';

// 30-min increments per the March 30 spec. 48 slots from 00:00 through 23:30.
const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? 0 : 30;
  const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const ampmHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const label = `${ampmHour}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
  return { value, label };
});

// pgw accepts a 15-min minimum lead time and a 30-day maximum. Both are
// PG-team-confirmable — defaulting here to the provisional values called out
// in the plan; adjust when PG confirms.
const MIN_LEAD_MS = 15 * 60 * 1000;
const MAX_LEAD_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Build an ISO 8601 string anchored to Asia/Singapore (+08:00). Pgw expects
 * dates in this zone — constructing the offset explicitly avoids surprises
 * when the browser's local TZ differs.
 */
function toSgtIso(date: Date, time: string): string {
  const [hStr, mStr] = time.split(':');
  const hh = String(Number.parseInt(hStr, 10)).padStart(2, '0');
  const mm = String(Number.parseInt(mStr, 10)).padStart(2, '0');
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}:00+08:00`;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-SG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Singapore',
  });
}

export interface SchedulePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fired on confirm. Receives ISO 8601 with +08:00 offset. */
  onConfirm: (scheduledSendAt: string) => void;
  /** Disables confirm while the parent is in flight. */
  busy?: boolean;
}

export function SchedulePickerDialog({
  open,
  onOpenChange,
  onConfirm,
  busy,
}: SchedulePickerDialogProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>('09:00');

  const scheduledSendAt = useMemo(() => {
    if (!date) return null;
    return toSgtIso(date, time);
  }, [date, time]);

  const validation = useMemo(() => {
    if (!scheduledSendAt) return { ok: false as const, reason: 'Pick a date first.' };
    const diff = new Date(scheduledSendAt).valueOf() - Date.now();
    if (diff < MIN_LEAD_MS) {
      return { ok: false as const, reason: 'Scheduled time must be at least 15 minutes from now.' };
    }
    if (diff > MAX_LEAD_MS) {
      return { ok: false as const, reason: 'Scheduled time cannot be more than 30 days away.' };
    }
    return { ok: true as const };
  }, [scheduledSendAt]);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const maxDate = useMemo(() => {
    const m = new Date();
    m.setHours(23, 59, 59, 999);
    m.setDate(m.getDate() + 30);
    return m;
  }, []);

  function handleConfirm() {
    if (!scheduledSendAt || !validation.ok) return;
    onConfirm(scheduledSendAt);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Schedule post</DialogTitle>
          <DialogDescription>
            Pick a date and time to send this post automatically. Parents will be notified at the
            scheduled moment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-xl border p-3">
            <DayPicker
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={{ before: today, after: maxDate }}
              showOutsideDays
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="schedule-time-select"
              className="text-sm font-medium text-muted-foreground"
            >
              Time (Asia/Singapore)
            </label>
            <Select
              value={time}
              onValueChange={(v) => {
                if (v != null) setTime(v);
              }}
            >
              <SelectTrigger id="schedule-time-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot.value} value={slot.value}>
                    {slot.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {scheduledSendAt && validation.ok && (
            <p className="text-sm text-muted-foreground">
              Will send on{' '}
              <span className="font-medium text-foreground">{formatWhen(scheduledSendAt)}</span>.
            </p>
          )}
          {!validation.ok && date && (
            <p className="text-sm text-destructive" role="alert">
              {validation.reason}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!validation.ok || busy}>
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
