import { ArrowDown, ArrowUp, ChevronLeft, MoreHorizontal, User } from 'lucide-react';
import React, { useMemo } from 'react';

import { Button } from '~/components/ui';
import type { PostFormState } from '~/containers/CreatePostView';
import { formatDateTime } from '~/helpers/dateTime';

interface PostPreviewProps {
  formState: PostFormState;
  currentUserName?: string;
  defaultEnquiryEmail?: string;
}

const PostPreview = React.memo(function PostPreview({
  formState,
  currentUserName = 'Daniel Tan',
  defaultEnquiryEmail = 'enquiry@school.edu.sg',
}: PostPreviewProps) {
  const { title, description, responseType, questions, enquiryEmail } = formState;
  // Freeze the preview timestamp to the moment the component mounts so
  // `React.memo` short-circuits re-renders when form state is unchanged.
  const timestamp = useMemo(() => formatDateTime(new Date().toISOString(), { case: 'upper' }), []);
  const hasContent = Boolean(title || description);
  const dimmedWhenEmpty = hasContent ? 'text-foreground' : 'text-muted-foreground/60';
  const enquiryContact = enquiryEmail || defaultEnquiryEmail;

  return (
    <div className="overflow-hidden rounded-3xl border-2 border-slate-900 bg-white">
      {/* Mobile chrome */}
      <div className="flex items-center justify-between px-4 py-3">
        <ChevronLeft className="h-4 w-4 text-foreground" strokeWidth={2} />
        <div className="flex items-center gap-3 text-foreground">
          <ArrowUp className="h-4 w-4" strokeWidth={2} />
          <ArrowDown className="h-4 w-4" strokeWidth={2} />
          <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
        </div>
      </div>

      <div className="flex min-h-[340px] flex-col px-5 pb-5">
        <div className="space-y-1">
          <p className={`text-lg leading-tight font-semibold ${dimmedWhenEmpty}`}>
            {title || 'Announcement title'}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {timestamp} · {currentUserName.toUpperCase()}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
          <User className="h-3 w-3" strokeWidth={2.25} />
          STUDENT NAME
        </div>

        <div className="mt-5 space-y-2">
          <p className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
            Details
          </p>
          {description ? (
            <p className="text-sm whitespace-pre-wrap text-foreground">{description}</p>
          ) : (
            <p className="text-sm text-muted-foreground/60">
              Your announcement details will appear here.
            </p>
          )}
        </div>

        {questions.length > 0 && (
          <div className="mt-5 space-y-3 border-t pt-4">
            <p className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
              Questions ({questions.length})
            </p>
            {questions.map((q, i) => (
              <div key={q.id} className="space-y-1">
                <p className="text-sm font-medium">
                  {i + 1}. {q.text || 'Untitled question'}
                </p>
                {q.type === 'mcq' && (
                  <ul className="ml-4 space-y-0.5">
                    {q.options.map((opt, j) => (
                      <li key={j} className="text-sm text-muted-foreground">
                        {String.fromCharCode(65 + j)}. {opt || 'Empty option'}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {responseType === 'acknowledge' && (
          <div className="mt-5">
            <Button variant="outline" size="sm" className="w-full" disabled>
              Acknowledge
            </Button>
          </div>
        )}
        {responseType === 'yes-no' && (
          <div className="mt-5 flex gap-2">
            <Button variant="default" size="sm" className="flex-1" disabled>
              Yes
            </Button>
            <Button variant="outline" size="sm" className="flex-1" disabled>
              No
            </Button>
          </div>
        )}

        <div className="mt-auto pt-8 text-center">
          <p className="text-[11px] text-muted-foreground italic">
            For enquiries on this post, please contact
          </p>
          <p className="text-[11px] text-muted-foreground italic">{enquiryContact}</p>
        </div>
      </div>
    </div>
  );
});

export { PostPreview };
export type { PostPreviewProps };
