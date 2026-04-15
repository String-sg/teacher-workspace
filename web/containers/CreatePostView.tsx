import { Typography } from '@flow/core';
import { ArrowLeft, Eye } from '@flow/icons';
import { useDeferredValue, useReducer, useState } from 'react';
import type { LoaderFunctionArgs } from 'react-router';
import { Link, Navigate, useLoaderData, useNavigate, useParams } from 'react-router';

import {
  createAnnouncement,
  createDraft,
  fetchSchoolClasses,
  fetchSchoolStaff,
  fetchSchoolStudents,
  fetchSession,
  loadPostDetail,
  updateDraft,
} from '~/api/client';
import type {
  PGApiSchoolClass,
  PGApiSchoolStaff,
  PGApiSchoolStudent,
  PGApiSession,
} from '~/api/types';
import type { SelectedEntity } from '~/components/comms/entity-selector';
import { StaffSelector } from '~/components/comms/staff-selector';
import { StudentRecipientSelector } from '~/components/comms/student-recipient-selector';
import { AttachmentSection } from '~/components/posts/AttachmentSection';
import { PostPreview } from '~/components/posts/PostPreview';
import { PostTypePicker } from '~/components/posts/PostTypePicker';
import { QuestionBuilder } from '~/components/posts/QuestionBuilder';
import { ResponseTypeSelector } from '~/components/posts/ResponseTypeSelector';
import { RichTextToolbar } from '~/components/posts/RichTextToolbar';
import { SendConfirmationDialog } from '~/components/posts/SendConfirmationDialog';
import { SplitPostButton } from '~/components/posts/SplitPostButton';
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '~/components/ui';
import type { FormQuestion, PGAnnouncement, ResponseType } from '~/data/mock-pg-announcements';

// ─── Route loader ───────────────────────────────────────────────────────────

interface CreatePostLoaderData {
  detail: PGAnnouncement | null;
  classes: PGApiSchoolClass[];
  staff: PGApiSchoolStaff[];
  students: PGApiSchoolStudent[];
  session: PGApiSession;
}

export async function loader({ params }: LoaderFunctionArgs): Promise<CreatePostLoaderData> {
  const [detail, classes, staff, students, session] = await Promise.all([
    params.id ? loadPostDetail(params.id) : Promise.resolve(null),
    fetchSchoolClasses(),
    fetchSchoolStaff(),
    fetchSchoolStudents(),
    fetchSession(),
  ]);
  return { detail, classes, staff, students, session };
}

// ─── Form state types ────────────────────────────────────────────────────────

interface PostFormState {
  title: string;
  description: string;
  selectedRecipients: SelectedEntity[];
  responseType: ResponseType;
  questions: FormQuestion[];

  selectedStaff: SelectedEntity[];
  enquiryEmail: string;
  dueDate: string;
}

type PostFormAction =
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_DESCRIPTION'; payload: string }
  | { type: 'SET_RESPONSE_TYPE'; payload: ResponseType }
  | { type: 'SET_RECIPIENTS'; payload: SelectedEntity[] }
  | { type: 'ADD_QUESTION' }
  | { type: 'UPDATE_QUESTION'; id: string; payload: Partial<FormQuestion> }
  | { type: 'REMOVE_QUESTION'; id: string }
  | { type: 'MOVE_QUESTION'; id: string; direction: 'up' | 'down' }
  | { type: 'SET_STAFF'; payload: SelectedEntity[] }
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_DUE_DATE'; payload: string };

const INITIAL_STATE: PostFormState = {
  title: '',
  description: '',
  selectedRecipients: [],
  responseType: 'view-only',
  questions: [],

  selectedStaff: [],
  enquiryEmail: '',
  dueDate: '',
};

function formReducer(state: PostFormState, action: PostFormAction): PostFormState {
  switch (action.type) {
    case 'SET_TITLE':
      return { ...state, title: action.payload };

    case 'SET_DESCRIPTION':
      return { ...state, description: action.payload };

    case 'SET_RESPONSE_TYPE':
      return { ...state, responseType: action.payload };

    case 'SET_RECIPIENTS':
      return { ...state, selectedRecipients: action.payload };

    case 'ADD_QUESTION': {
      const newQuestion: FormQuestion = {
        id: crypto.randomUUID(),
        text: '',
        type: 'free-text',
      };
      return { ...state, questions: [...state.questions, newQuestion] };
    }

    case 'UPDATE_QUESTION': {
      return {
        ...state,
        questions: state.questions.map((q) => {
          if (q.id !== action.id) return q;
          const updated = { ...q, ...action.payload };
          // Handle type transitions correctly
          if (action.payload.type === 'mcq' && q.type !== 'mcq') {
            return {
              id: q.id,
              text: updated.text,
              type: 'mcq' as const,
              options: (action.payload as { options?: [string, ...string[]] }).options ?? ['', ''],
            };
          }
          if (action.payload.type === 'free-text' && q.type !== 'free-text') {
            return {
              id: q.id,
              text: updated.text,
              type: 'free-text' as const,
            };
          }
          // Same type, just update fields
          if (q.type === 'mcq') {
            return {
              ...q,
              ...action.payload,
              type: 'mcq' as const,
              options: (action.payload as { options?: [string, ...string[]] }).options ?? q.options,
            };
          }
          return { ...q, ...action.payload, type: 'free-text' as const };
        }),
      };
    }

    case 'REMOVE_QUESTION':
      return {
        ...state,
        questions: state.questions.filter((q) => q.id !== action.id),
      };

    case 'MOVE_QUESTION': {
      const idx = state.questions.findIndex((q) => q.id === action.id);
      if (idx === -1) return state;
      const newIdx = action.direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= state.questions.length) return state;
      const newQuestions = [...state.questions];
      [newQuestions[idx], newQuestions[newIdx]] = [newQuestions[newIdx], newQuestions[idx]];
      return { ...state, questions: newQuestions };
    }

    case 'SET_STAFF':
      return { ...state, selectedStaff: action.payload };

    case 'SET_EMAIL':
      return { ...state, enquiryEmail: action.payload };

    case 'SET_DUE_DATE':
      return { ...state, dueDate: action.payload };

    default:
      return state;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Convert flat SelectedEntity[] from the recipient selector into the grouped
// shape `toPGCreatePayload` expects. Individual-student selections aren't
// yet supported by the FE payload — tracked as a follow-up.
function groupRecipients(recipients: SelectedEntity[]): {
  classIds: number[];
  customGroupIds: number[];
  ccaIds: number[];
  levelIds: number[];
} {
  const out = {
    classIds: [] as number[],
    customGroupIds: [] as number[],
    ccaIds: [] as number[],
    levelIds: [] as number[],
  };
  for (const r of recipients) {
    const id = Number(r.id);
    if (Number.isNaN(id)) continue;
    switch (r.groupType) {
      case 'class':
        out.classIds.push(id);
        break;
      case 'custom':
        out.customGroupIds.push(id);
        break;
      case 'cca':
        out.ccaIds.push(id);
        break;
      case 'level':
        out.levelIds.push(id);
        break;
    }
  }
  return out;
}

function announcementToFormState(
  announcement: PGAnnouncement,
  staff: PGApiSchoolStaff[],
): PostFormState {
  // TODO: back-translate announcement.recipients and staffInCharge into
  // SelectedEntity[] when edit mode is revisited.
  const staffMatch = staff.find((s) => s.name === announcement.staffInCharge);
  return {
    title: announcement.title,
    description: announcement.description,
    selectedRecipients: [],
    responseType: announcement.responseType,
    questions: announcement.questions ?? [],

    selectedStaff: staffMatch
      ? [
          {
            id: staffMatch.staffId.toString(),
            label: staffMatch.name,
            type: 'individual',
            count: 1,
          },
        ]
      : [],
    enquiryEmail: announcement.enquiryEmail ?? '',
    dueDate: announcement.dueDate ?? '',
  };
}

// ─── Inner component ─────────────────────────────────────────────────────────

function CreatePostViewInner({ editId }: { editId?: string }) {
  const navigate = useNavigate();
  const { detail, classes, staff, students, session } = useLoaderData<CreatePostLoaderData>();
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Enquiry-email options derived from the logged-in staff profile.
  const emailOptions = [session.staffEmailAdd, session.schoolEmailAddress].filter(
    (e): e is string => Boolean(e),
  );

  // Type picker state — skip in edit mode, infer from loaded data
  const [selectedType, setSelectedType] = useState<'post' | 'post-with-response' | null>(() => {
    if (!editId) return null;
    if (detail && (detail.responseType === 'acknowledge' || detail.responseType === 'yes-no')) {
      return 'post-with-response';
    }
    return 'post';
  });

  // For edit mode, map loader data to form state
  const editData = detail ? announcementToFormState(detail, staff) : null;

  const [state, dispatch] = useReducer(formReducer, editData ?? INITIAL_STATE);

  const deferredState = useDeferredValue(state);
  const isFormValid = state.title.trim().length > 0;
  const recipientCount = state.selectedRecipients.reduce((sum, r) => sum + (r.count ?? 1), 0);
  const isEditing = Boolean(editId);

  // If editing but API returned nothing, redirect (after hooks)
  if (editId && !editData) {
    return <Navigate to="/posts" replace />;
  }

  function handleTypeSelect(type: 'post' | 'post-with-response') {
    setSelectedType(type);
    if (type === 'post-with-response') {
      dispatch({ type: 'SET_RESPONSE_TYPE', payload: 'acknowledge' });
    }
  }

  function buildPayload() {
    return {
      title: state.title,
      richTextContent: JSON.stringify({
        type: 'doc',
        content: state.description.split('\n').map((line) => ({
          type: 'paragraph',
          attrs: { textAlign: 'left' },
          content: line ? [{ type: 'text', text: line }] : [],
        })),
      }),
      enquiryEmailAddress: state.enquiryEmail,
      recipients: groupRecipients(state.selectedRecipients),
      staffOwnerIds: state.selectedStaff.map((s) => Number(s.id)),
    };
  }

  async function handleSaveDraft() {
    setIsSaving(true);
    const payload = buildPayload();
    try {
      if (isEditing && editId) {
        await updateDraft(Number(editId), payload);
      } else {
        await createDraft(payload);
      }
      navigate('/posts');
    } catch {
      alert('Failed to save draft. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSendConfirm() {
    setShowSendDialog(false);
    setIsSaving(true);
    const payload = buildPayload();
    try {
      await createAnnouncement(payload);
      // Keep isSaving=true until navigation completes to prevent double-submit
      setTimeout(() => navigate('/posts'), 150);
    } catch {
      alert('Failed to send post. Please try again.');
      setIsSaving(false);
    }
  }

  if (!selectedType) {
    return (
      <div className="flex flex-col">
        {/* Minimal header */}
        <div className="sticky top-0 z-10 border-b bg-white/95 px-6 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Link to="/posts" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Typography variant="title-md" asChild>
              <h1>New Post</h1>
            </Typography>
          </div>
        </div>

        <PostTypePicker onSelect={handleTypeSelect} />
      </div>
    );
  }

  // ── Form view ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/95 px-6 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* Left: back arrow + title */}
          <div className="flex items-center gap-3">
            <Link to="/posts" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Typography variant="title-md" asChild>
              <h1>{isEditing ? 'Edit Post' : 'New Post'}</h1>
            </Typography>
          </div>

          {/* Right: preview toggle + split button */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobilePreview(!showMobilePreview)}
              className="hidden max-lg:flex"
            >
              <Eye className="mr-1.5 h-4 w-4" />
              Show Preview
            </Button>

            <SplitPostButton
              disabled={!isFormValid || isSaving}
              onPost={() => setShowSendDialog(true)}
              onSchedule={handleSaveDraft}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex justify-center gap-8 px-6 py-6">
        {/* Form column */}
        <div className="max-w-2xl flex-1 space-y-6">
          {/* RECIPIENTS Card */}
          <Card>
            <CardContent className="space-y-5 p-6">
              <Typography
                variant="label-sm"
                className="tracking-widest text-muted-foreground uppercase"
              >
                Recipients
              </Typography>

              {/* Students field */}
              <div className="space-y-1.5">
                <Label>
                  Students <span className="text-red-500">*</span>
                </Label>
                <Typography variant="body-sm" className="text-muted-foreground">
                  Parents of the selected students will receive this post via Parents Gateway.
                </Typography>
                <StudentRecipientSelector
                  value={state.selectedRecipients}
                  onChange={(recipients) =>
                    dispatch({ type: 'SET_RECIPIENTS', payload: recipients })
                  }
                  classes={classes}
                  students={students}
                />
              </div>

              {/* Staff in charge */}
              <div className="space-y-1.5">
                <Label>Staff in charge</Label>
                <Typography variant="body-sm" className="text-muted-foreground">
                  These staff will be able to view read status, and delete the post.
                </Typography>
                <StaffSelector
                  value={state.selectedStaff}
                  onChange={(sel) => dispatch({ type: 'SET_STAFF', payload: sel })}
                  staff={staff}
                />
              </div>

              {/* Enquiry email */}
              <div className="space-y-1.5">
                <Label>Enquiry email</Label>
                <Typography variant="body-sm" className="text-muted-foreground">
                  Select the preferred email address to receive enquiries from parents.
                </Typography>
                <Select
                  value={state.enquiryEmail}
                  onValueChange={(value) => dispatch({ type: 'SET_EMAIL', payload: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select enquiry email" />
                  </SelectTrigger>
                  <SelectContent>
                    {emailOptions.map((email) => (
                      <SelectItem key={email} value={email}>
                        {email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* CONTENT Card */}
          <Card>
            <CardContent className="space-y-5 p-6">
              <Typography
                variant="label-sm"
                className="tracking-widest text-muted-foreground uppercase"
              >
                Content
              </Typography>

              {/* Title with counter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="post-title">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Typography variant="body-sm" className="text-muted-foreground">
                    {state.title.length}/120
                  </Typography>
                </div>
                <Input
                  id="post-title"
                  placeholder="e.g. Term 3 School Camp Consent & Payment"
                  value={state.title}
                  maxLength={120}
                  onChange={(e) => dispatch({ type: 'SET_TITLE', payload: e.target.value })}
                />
              </div>

              {/* Description with counter and toolbar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="post-description">Description</Label>
                  <Typography variant="body-sm" className="text-muted-foreground">
                    {state.description.length}/2000
                  </Typography>
                </div>
                <div>
                  <RichTextToolbar />
                  <Textarea
                    id="post-description"
                    className="min-h-[120px] rounded-t-none"
                    placeholder="Write your announcement here. Use the toolbar to format text and insert inline links."
                    value={state.description}
                    maxLength={2000}
                    onChange={(e) =>
                      dispatch({
                        type: 'SET_DESCRIPTION',
                        payload: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Attachments */}
              <AttachmentSection />
            </CardContent>
          </Card>

          {/* RESPONSE Card (only for post-with-response) */}
          {selectedType === 'post-with-response' && (
            <Card>
              <CardContent className="space-y-5 p-6">
                <Typography
                  variant="label-sm"
                  className="tracking-widest text-muted-foreground uppercase"
                >
                  Response
                </Typography>

                <div className="space-y-4">
                  <ResponseTypeSelector
                    value={state.responseType}
                    onChange={(value) => dispatch({ type: 'SET_RESPONSE_TYPE', payload: value })}
                  >
                    {/* Conditional content for acknowledge/yes-no */}
                    <div className="mt-6 space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="due-date">Due Date</Label>
                        <Input
                          id="due-date"
                          type="date"
                          value={state.dueDate}
                          onChange={(e) =>
                            dispatch({
                              type: 'SET_DUE_DATE',
                              payload: e.target.value,
                            })
                          }
                          className="max-w-[240px]"
                        />
                      </div>

                      <QuestionBuilder questions={state.questions} dispatch={dispatch} />
                    </div>
                  </ResponseTypeSelector>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Preview (desktop) */}
        <div className="hidden w-[320px] shrink-0 lg:block">
          <div className="sticky top-[72px]">
            <Typography variant="body-sm" className="mb-3 font-medium text-muted-foreground">
              Preview
            </Typography>
            <PostPreview formState={deferredState} />
          </div>
        </div>
      </div>

      {/* Mobile preview — kept mounted to avoid flicker on toggle */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-150 lg:hidden ${
          showMobilePreview
            ? 'pointer-events-auto bg-black/50'
            : 'pointer-events-none bg-transparent'
        }`}
        onClick={() => setShowMobilePreview(false)}
      >
        <div
          className={`absolute top-0 right-0 bottom-0 w-[340px] overflow-y-auto bg-white p-4 shadow-xl transition-transform duration-150 ${
            showMobilePreview ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <Typography variant="body-sm" className="font-medium">
              Preview
            </Typography>
            <Button variant="ghost" size="sm" onClick={() => setShowMobilePreview(false)}>
              Close
            </Button>
          </div>
          <PostPreview formState={deferredState} />
        </div>
      </div>

      {/* Send confirmation dialog */}
      <SendConfirmationDialog
        open={showSendDialog}
        onOpenChange={setShowSendDialog}
        title={state.title}
        recipientCount={recipientCount}
        responseType={state.responseType}
        onConfirm={handleSendConfirm}
      />
    </div>
  );
}

// ─── Route component ─────────────────────────────────────────────────────────

function CreatePostView() {
  const { id } = useParams();
  return <CreatePostViewInner key={id ?? 'new'} editId={id} />;
}

export { CreatePostView as Component };
export type { PostFormAction, PostFormState };
