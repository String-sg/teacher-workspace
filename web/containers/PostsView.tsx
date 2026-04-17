import {
  AlertTriangle,
  Copy,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Users,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Link, useLoaderData, useNavigate, useRevalidator } from 'react-router';

import { deleteAnnouncement, duplicateAnnouncement, loadPostsList } from '~/api/client';
import { ReadRate } from '~/components/posts/ReadRate';
import { StatusBadge } from '~/components/posts/StatusBadge';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
} from '~/components/ui';
import type { PGAnnouncement } from '~/data/mock-pg-announcements';
import { requiresResponse } from '~/data/mock-pg-announcements';
import { formatDate, getRelevantDate, isLowReadRate } from '~/helpers/dateTime';

type PostTab = 'view-only' | 'with-responses';

// ─── Route loader ───────────────────────────────────────────────────────────

export async function loader() {
  return loadPostsList();
}

// ─── Component ──────────────────────────────────────────────────────────────

const PostsView: React.FC = () => {
  const navigate = useNavigate();
  const announcements = useLoaderData<PGAnnouncement[]>();
  const revalidator = useRevalidator();
  const [tab, setTab] = useState<PostTab>('view-only');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return announcements
      .filter((a) => {
        if (tab === 'view-only' && requiresResponse(a.responseType)) return false;
        if (tab === 'with-responses' && !requiresResponse(a.responseType)) return false;

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return a.title.toLowerCase().includes(q);
        }
        return true;
      })
      .map((a) => {
        const date = getRelevantDate(a);
        return { ...a, _date: date, _dateTs: new Date(date ?? 0).getTime() };
      })
      .sort((a, b) => b._dateTs - a._dateTs);
  }, [announcements, searchQuery, tab]);

  const showResponseColumn = tab === 'with-responses';

  return (
    <div className="flex flex-col">
      {/* Page header */}
      <div className="border-b px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>
            <p className="text-sm text-muted-foreground">
              Send posts to parents via Parents Gateway, send a view-only post or collect responses.
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            render={<Link to="/posts/new" />}
            nativeButton={false}
          >
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      {/* Toolbar: tabs + search + filter */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as PostTab)}>
            <TabsList>
              <TabsTrigger value="view-only">Posts</TabsTrigger>
              <TabsTrigger value="with-responses">Posts with responses</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-w-[220px] pl-9 sm:w-[280px]"
                aria-label="Search posts"
              />
            </div>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="max-w-full overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              {searchQuery ? (
                <>
                  <p className="text-base text-foreground">No posts match your search.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try adjusting your search terms.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base text-foreground">No posts yet.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create your first post to get started.
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    className="mt-4"
                    render={<Link to="/posts/new" />}
                    nativeButton={false}
                  >
                    <Plus className="h-4 w-4" />
                    Create
                  </Button>
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader className="border-b bg-white">
                <TableRow>
                  <TableHead className="min-w-[360px] pl-6">Title</TableHead>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="w-[110px]">Status</TableHead>
                  <TableHead className="w-[90px]">Owner</TableHead>
                  <TableHead className="w-[170px]">
                    {showResponseColumn ? 'Read / Response' : 'Read'}
                  </TableHead>
                  <TableHead className="w-[48px] pr-2">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((announcement) => {
                  const { totalCount, readCount } = announcement.stats;
                  const showLowRead = isLowReadRate(announcement.postedAt, readCount, totalCount);
                  const relevantDate = announcement._date;
                  const isShared = announcement.ownership === 'shared';

                  return (
                    <TableRow
                      key={announcement.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/posts/${announcement.id}`)}
                    >
                      {/* Title + description stacked */}
                      <TableCell className="overflow-hidden pl-6 align-top whitespace-normal">
                        <div className="min-w-0 py-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-medium">{announcement.title}</span>
                            {showLowRead && (
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                            )}
                          </div>
                          {announcement.description && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {announcement.description}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-sm text-muted-foreground">
                        <span
                          className={
                            announcement.status === 'scheduled' ? 'text-amber-600' : undefined
                          }
                        >
                          {formatDate(relevantDate)}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <StatusBadge status={announcement.status} />
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
                          <span className="text-sm text-muted-foreground">{'\u2014'}</span>
                        ) : (
                          <ReadRate readCount={readCount} totalCount={totalCount} />
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="w-[48px] pr-2 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                aria-label="More actions"
                                onClick={(e) => e.stopPropagation()}
                              />
                            }
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateAnnouncement({
                                  postId: Number(announcement.id),
                                })
                                  .then(() => {
                                    revalidator.revalidate();
                                  })
                                  .catch(() => {
                                    alert('Failed to duplicate post.');
                                  });
                              }}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            {!isShared && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!confirm('Delete this post?')) return;
                                    try {
                                      await deleteAnnouncement(announcement.id);
                                      revalidator.revalidate();
                                    } catch {
                                      alert('Failed to delete post.');
                                    }
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
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
