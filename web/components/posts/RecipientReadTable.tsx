import { Check, Clock, Columns3, Download, Search, SlidersHorizontal, X } from 'lucide-react';

import {
  Badge,
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui';
import type { PGRecipient, ResponseType } from '~/data/mock-pg-announcements';
import { formatDate } from '~/helpers/dateTime';

interface RecipientReadTableProps {
  recipients: PGRecipient[];
  responseType: ResponseType;
}

export function RecipientReadTable({ recipients, responseType }: RecipientReadTableProps) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
        Recipient read status
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search student or parent..."
            className="pl-9"
            aria-label="Search student or parent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <SlidersHorizontal className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Columns3 className="h-4 w-4" />
            Columns
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{recipients.length} recipients</p>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Index No.</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Read Status</TableHead>
              <TableHead>Read At</TableHead>
              {responseType === 'acknowledge' && (
                <>
                  <TableHead>Acknowledged</TableHead>
                  <TableHead>Acknowledged At</TableHead>
                </>
              )}
              {responseType === 'yes-no' && (
                <>
                  <TableHead>Response</TableHead>
                  <TableHead>Responded At</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipients.map((recipient) => (
              <TableRow key={recipient.studentId}>
                <TableCell className="font-medium">{recipient.studentName}</TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {recipient.indexNo}
                </TableCell>
                <TableCell className="text-muted-foreground">{recipient.classLabel}</TableCell>
                <TableCell>
                  {recipient.readStatus === 'read' ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-10">
                      <Check className="h-4 w-4" strokeWidth={2.25} />
                      Read
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-10">
                      <Clock className="h-4 w-4" strokeWidth={2.25} />
                      Unread
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {recipient.readStatus === 'read' ? formatDate(recipient.respondedAt) : '\u2014'}
                </TableCell>
                {responseType === 'acknowledge' && (
                  <>
                    <TableCell>
                      {recipient.acknowledgedAt ? (
                        <Check className="h-4 w-4 text-green-10" />
                      ) : (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(recipient.acknowledgedAt)}
                    </TableCell>
                  </>
                )}
                {responseType === 'yes-no' && (
                  <>
                    <TableCell>
                      {recipient.formResponse === 'yes' ? (
                        <Badge className="bg-green-3 text-green-11 hover:bg-green-3">Yes</Badge>
                      ) : recipient.formResponse === 'no' ? (
                        <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10">
                          No
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">{'\u2014'}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(recipient.respondedAt)}
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
