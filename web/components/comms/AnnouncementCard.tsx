import { Typography } from '@flow/core';

import { Card, CardContent } from '~/components/ui';

interface AnnouncementCardProps {
  title: string;
  description: string;
  enquiryEmail?: string;
  staffInCharge?: string;
  className?: string;
}

export function AnnouncementCard({
  title,
  description,
  enquiryEmail,
  staffInCharge,
  className,
}: AnnouncementCardProps) {
  return (
    <Card className={className}>
      <CardContent className="space-y-4 p-5">
        <Typography
          variant="label-xs"
          className="text-muted-foreground uppercase tracking-widest"
        >
          ANNOUNCEMENT
        </Typography>

        <Typography variant="body-sm" className="font-medium text-base">
          {title}
        </Typography>

        <Typography
          variant="body-sm"
          className="text-muted-foreground whitespace-pre-line"
        >
          {description}
        </Typography>

        {enquiryEmail && (
          <div className="mt-6">
            <Typography
              variant="label-xs"
              className="text-muted-foreground"
            >
              Enquiry contact
            </Typography>
            <Typography variant="body-sm" className="font-medium">
              {enquiryEmail}
            </Typography>
          </div>
        )}

        {staffInCharge && (
          <div className="mt-4">
            <Typography
              variant="label-xs"
              className="text-muted-foreground"
            >
              Staff in charge
            </Typography>
            <Typography variant="body-sm" className="font-medium">
              {staffInCharge}
            </Typography>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
