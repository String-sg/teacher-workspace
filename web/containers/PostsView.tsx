import { cn, Typography } from '@flow/core';
import {
  AlertTriangle,
  Copy,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { Badge } from '~/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Input } from '~/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {
  mockPGAnnouncements,
  type PGAnnouncement,
  type PGStatus,
} from '~/data/mock-pg-announcements';

type PostTab = 'view-only' | 'with-responses';

const STATUS_CONFIG: Record<PGStatus, { label: string; className: string }> = {
  posted: {
    label: 'Posted',
    className: 'bg-green-50 text-green-700 border-green-200',
  },
  scheduled: {
    label: 'Scheduled',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  draft: {
    label: 'Draft',
    className: 'bg-slate-3 text-slate-11 border-slate-6',
  },
};

function formatDate(iso: string | undefined): string {
  if (!iso) return '\u2014';
  return new Intl.DateTimeFormat('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

function isLowReadRate(
  postedAt: string | undefined,
  readCount: number,
  total: number,
): boolean {
  if (!postedAt || total === 0) return false;
  const hoursElapsed =
    (Date.now() - new Date(postedAt).getTime()) / 3_600_000;
  return hoursElapsed >= 48 && readCount / total < 0.5;
}

function getRelevantDate(announcement: PGAnnouncement): string | undefined {
  if (announcement.status === 'posted') return announcement.postedAt;
  if (announcement.status === 'scheduled') return announcement.scheduledAt;
  return announcement.createdAt;
}

function SegmentedTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={cn(
        'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

const PostsView: React.FC = () => {
  const [tab, setTab] = useState<PostTab>('view-only');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return mockPGAnnouncements
      .filter((a) => {
        const hasResponse =
          a.responseType === 'acknowledge' || a.responseType === 'yes-no';
        if (tab === 'view-only' && hasResponse) return false;
        if (tab === 'with-responses' && !hasResponse) return false;

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            a.title.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = getRelevantDate(a) ?? '';
        const dateB = getRelevantDate(b) ?? '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
  }, [tab, searchQuery]);

  return (
    <div className="flex flex-col">
      {/* Page header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <Typography variant="title-lg" asChild>
            <h1>Posts</h1>
          </Typography>
          <button
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            disabled
          >
            <Plus className="h-4 w-4" />
            Create
          </button>
        </div>
        <p className="mt-1 hidden text-sm text-muted-foreground md:block">
          Send posts to parents via Parents Gateway. Send a view-only post or
          collect responses.
        </p>
      </div>

      {/* Toolbar: tabs + search */}
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between gap-4 px-6">
          <div className="flex shrink-0 gap-1 rounded-full bg-muted p-1">
            <SegmentedTab
              active={tab === 'view-only'}
              onClick={() => setTab('view-only')}
            >
              Posts
            </SegmentedTab>
            <SegmentedTab
              active={tab === 'with-responses'}
              onClick={() => setTab('with-responses')}
            >
              Posts with responses
            </SegmentedTab>
          </div>

          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[240px] pl-9"
              aria-label="Search posts"
            />
          </div>
        </div>

        {/* Table */}
        <div className="max-w-full overflow-x-auto bg-white">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No posts match your search.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead className="w-[500px] pl-6">Title</TableHead>
                  <TableHead className="w-[110px]">Date</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[90px]">Owner</TableHead>
                  <TableHead className="w-[150px]">
                    Read / Response
                  </TableHead>
                  <TableHead className="w-[48px] pr-2">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((announcement) => {
                  const totalCount = announcement.recipients.length;
                  const readCount = announcement.recipients.filter(
                    (r) => r.readStatus === 'read',
                  ).length;
                  const responseCount = announcement.recipients.filter(
                    (r) => r.respondedAt != null,
                  ).length;
                  const yesCount = announcement.recipients.filter(
                    (r) => r.formResponse === 'yes',
                  ).length;
                  const noCount = announcement.recipients.filter(
                    (r) => r.formResponse === 'no',
                  ).length;
                  const hasResponseType =
                    announcement.responseType === 'acknowledge' ||
                    announcement.responseType === 'yes-no';
                  const showLowRead = isLowReadRate(
                    announcement.postedAt,
                    readCount,
                    totalCount,
                  );
                  const relevantDate = getRelevantDate(announcement);
                  const isShared = announcement.ownership === 'shared';
                  const statusConfig = STATUS_CONFIG[announcement.status];

                  return (
                    <TableRow key={announcement.id} className="cursor-pointer">
                      {/* Title */}
                      <TableCell className="overflow-hidden pl-6 whitespace-normal">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-medium">
                              {announcement.title}
                            </span>
                            {announcement.responseType === 'acknowledge' && (
                              <span className="shrink-0 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 ring-1 ring-inset ring-blue-200">
                                Acknowledge
                              </span>
                            )}
                            {announcement.responseType === 'yes-no' && (
                              <span className="shrink-0 rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-600 ring-1 ring-inset ring-violet-200">
                                Yes/No
                              </span>
                            )}
                            {showLowRead && (
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                            )}
                          </div>
                          <div className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                            {announcement.description}
                          </div>
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-sm text-muted-foreground">
                        <span
                          className={
                            announcement.status === 'scheduled'
                              ? 'text-amber-600'
                              : undefined
                          }
                        >
                          {formatDate(relevantDate)}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusConfig.className}
                        >
                          {statusConfig.label}
                        </Badge>
                      </TableCell>

                      {/* Owner */}
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          {isShared ? (
                            <>
                              <Users className="h-3.5 w-3.5 shrink-0" />
                              <span>Shared</span>
                            </>
                          ) : (
                            <span>Mine</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Read / Response */}
                      <TableCell className="pr-6">
                        {announcement.status !== 'posted' ? (
                          <span className="text-sm text-muted-foreground">
                            {'\u2014'}
                          </span>
                        ) : hasResponseType ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {responseCount}/{totalCount}
                              </span>
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-4">
                                <div
                                  className="h-full rounded-full bg-blue-9 transition-all"
                                  style={{
                                    width: `${totalCount > 0 ? (responseCount / totalCount) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                            </div>
                            {announcement.responseType === 'yes-no' &&
                              totalCount > 0 && (
                                <p className="text-[11px] text-muted-foreground">
                                  {yesCount} yes &middot; {noCount} no
                                </p>
                              )}
                            {announcement.responseType === 'acknowledge' && (
                              <p className="text-[11px] text-muted-foreground">
                                Acknowledged
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {readCount}/{totalCount}
                            </span>
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-4">
                              <div
                                className="h-full rounded-full bg-blue-9 transition-all"
                                style={{
                                  width: `${totalCount > 0 ? (readCount / totalCount) * 100 : 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell
                        className="w-[48px] pr-2 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              aria-label="More actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export { PostsView as Component };
