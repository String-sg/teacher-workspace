import { Typography } from '@flow/core';
import { Check, Columns3, Download, Search, SlidersHorizontal, X } from '@flow/icons';

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
import { formatDate } from '~/helpers/dateTime';

import type { PGRecipient, ResponseType } from '~/data/mock-pg-announcements';

interface RecipientReadTableProps {
  recipients: PGRecipient[];
  responseType: ResponseType;
}

export function RecipientReadTable({ recipients, responseType }: RecipientReadTableProps) {
  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search student or parent..."
            className="pl-9"
            aria-label="Search student or parent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <SlidersHorizontal className="mr-1.5 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Columns3 className="mr-1.5 h-4 w-4" />
            Columns
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download className="mr-1.5 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Recipient count */}
      <Typography variant="body-sm" className="text-muted-foreground">
        {recipients.length} recipients
      </Typography>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Index No.</TableHead>
            <TableHead>Read Status</TableHead>
            <TableHead>Read At</TableHead>
            <TableHead>Parent</TableHead>
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
              <TableCell className="font-medium">
                {recipient.studentName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {recipient.classLabel}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {recipient.indexNo}
              </TableCell>
              <TableCell>
                {recipient.readStatus === 'read' ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {recipient.readStatus === 'read'
                  ? formatDate(recipient.respondedAt)
                  : '\u2014'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {recipient.parentName}
              </TableCell>
              {responseType === 'acknowledge' && (
                <>
                  <TableCell>
                    {recipient.acknowledgedAt ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
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
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Yes
                      </Badge>
                    ) : recipient.formResponse === 'no' ? (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
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
