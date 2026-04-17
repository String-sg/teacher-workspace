import { Paperclip } from 'lucide-react';

import { Card, CardContent, Separator } from '~/components/ui';

interface Attachment {
  name: string;
  sizeKb: number;
}

interface AnnouncementCardProps {
  title: string;
  description: string;
  attachments?: Attachment[];
  enquiryEmail?: string;
  staffInCharge?: string;
  className?: string;
}

function formatSize(sizeKb: number) {
  if (sizeKb >= 1024) {
    return `${(sizeKb / 1024).toFixed(1)} MB`;
  }
  return `${sizeKb} KB`;
}

export function AnnouncementCard({
  title,
  description,
  attachments,
  enquiryEmail,
  staffInCharge,
  className,
}: AnnouncementCardProps) {
  return (
    <Card className={className}>
      <CardContent className="space-y-4 p-5">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Announcement
        </p>

        <div className="space-y-3">
          <h3 className="text-base leading-snug font-semibold">{title}</h3>
          <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
            {description}
          </p>
        </div>

        {attachments && attachments.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Attachments</p>
              <ul className="space-y-1.5">
                {attachments.map((att) => (
                  <li key={att.name} className="flex items-center gap-2 text-sm">
                    <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{att.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {formatSize(att.sizeKb)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {enquiryEmail && (
          <>
            <Separator />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Enquiry contact</p>
              <p className="text-sm font-medium">{enquiryEmail}</p>
            </div>
          </>
        )}

        {staffInCharge && (
          <>
            <Separator />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Staff in charge</p>
              <p className="text-sm font-medium">{staffInCharge}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
