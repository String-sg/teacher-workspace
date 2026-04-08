import { Typography } from '@flow/core';
import { ArrowLeft, Eye } from '@flow/icons';
import { useDeferredValue, useReducer, useState } from 'react';
import {
  Link,
  Navigate,
  useLoaderData,
  useNavigate,
  useParams,
} from 'react-router';

import {
  createAnnouncement,
  createDraft,
  loadPostDetail,
  updateDraft,
} from '~/api/client';
import { AttachmentSection } from '~/components/comms/AttachmentSection';
import { PostPreview } from '~/components/comms/PostPreview';
import { PostTypePicker } from '~/components/comms/PostTypePicker';
import { QuestionBuilder } from '~/components/comms/QuestionBuilder';
import { RecipientSelector } from '~/components/comms/RecipientSelector';
import { ResponseTypeSelector } from '~/components/comms/ResponseTypeSelector';
import { RichTextToolbar } from '~/components/comms/RichTextToolbar';
import { SendConfirmationDialog } from '~/components/comms/SendConfirmationDialog';
import { SplitPostButton } from '~/components/comms/SplitPostButton';
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

import type { LoaderFunctionArgs } from 'react-router';

// ─── Route loader (only fetches for edit mode) ──────────────────────────────

export async function loader({ params }: LoaderFunctionArgs) {
  if (!params.id) return null;
  return loadPostDetail(params.id);
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const MOCK_CLASSES = [
  {
    id: '3A',
    label: 'Class 3A',
    students: ['Chen Jun Kai', 'Vincent Koh', 'Sarah Lim', 'Ahmad bin Hassan'],
  },
  {
    id: '3B',
    label: 'Class 3B',
    students: ['Priya Nair', 'James Tan', 'Wei Ling Ong'],
  },
  {
    id: '3C',
    label: 'Class 3C',
    students: ['Rachel Wong', 'Muhammad Irfan', 'Jessica Lee'],
  },
];

const MOCK_STAFF = [
  { id: 'staff-1', name: 'Mrs. Tan Mei Lin', department: 'Form Teacher' },
  { id: 'staff-2', name: 'Mr. Wong Kai Ming', department: 'Co-Form Teacher' },
  { id: 'staff-3', name: 'Ms. Lim Siew Hoon', department: 'Year Head' },
  { id: 'staff-4', name: 'Mr. Ahmad bin Ibrahim', department: 'HOD English' },
  { id: 'staff-5', name: 'Mrs. Chen Li Hua', department: 'SEN Coordinator' },
];


const MOCK_EMAILS = [
  'school_enquiry@moe.gov.sg',
  'form_teacher_3a@school.edu.sg',
  'year_head_sec3@school.edu.sg',
];

// ─── Form state types ────────────────────────────────────────────────────────

interface PostFormState {
  title: string;
  description: string;
  selectedClasses: string[];
  responseType: ResponseType;
  questions: FormQuestion[];

  staffInCharge: string;
  enquiryEmail: string;
  dueDate: string;
}

type PostFormAction =
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_DESCRIPTION'; payload: string }
  | { type: 'SET_RESPONSE_TYPE'; payload: ResponseType }
  | { type: 'TOGGLE_CLASS'; payload: string }
  | { type: 'ADD_QUESTION' }
  | { type: 'UPDATE_QUESTION'; id: string; payload: Partial<FormQuestion> }
  | { type: 'REMOVE_QUESTION'; id: string }
  | { type: 'MOVE_QUESTION'; id: string; direction: 'up' | 'down' }
  | { type: 'SET_STAFF'; payload: string }
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_DUE_DATE'; payload: string };

const INITIAL_STATE: PostFormState = {
  title: '',
  description: '',
  selectedClasses: [],
  responseType: 'view-only',
  questions: [],

  staffInCharge: '',
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

    case 'TOGGLE_CLASS': {
      const id = action.payload;
      const selected = state.selectedClasses.includes(id)
        ? state.selectedClasses.filter((c) => c !== id)
        : [...state.selectedClasses, id];
      return { ...state, selectedClasses: selected };
    }

    case 'ADD_QUESTION': {
      const newQuestion: FormQuestion = {
        id: Date.now().toString(),
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
              options: (action.payload as { options?: [string, ...string[]] })
                .options ?? ['', ''],
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
              options:
                (action.payload as { options?: [string, ...string[]] })
                  .options ?? q.options,
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
      [newQuestions[idx], newQuestions[newIdx]] = [
        newQuestions[newIdx],
        newQuestions[idx],
      ];
      return { ...state, questions: newQuestions };
    }


    case 'SET_STAFF':
      return { ...state, staffInCharge: action.payload };

    case 'SET_EMAIL':
      return { ...state, enquiryEmail: action.payload };

    case 'SET_DUE_DATE':
      return { ...state, dueDate: action.payload };

    default:
      return state;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function announcementToFormState(
  announcement: PGAnnouncement,
): PostFormState {
  return {
    title: announcement.title,
    description: announcement.description,
    selectedClasses: [
      ...new Set(announcement.recipients.map((r) => r.classId)),
    ],
    responseType: announcement.responseType,
    questions: announcement.questions ?? [],

    staffInCharge:
      MOCK_STAFF.find((s) => s.name === announcement.staffInCharge)?.id ?? '',
    enquiryEmail: announcement.enquiryEmail ?? '',
    dueDate: announcement.dueDate ?? '',
  };
}

function getRecipientCount(selectedClasses: string[]): number {
  return MOCK_CLASSES.filter((c) => selectedClasses.includes(c.id)).reduce(
    (sum, c) => sum + c.students.length,
    0,
  );
}

// ─── Inner component ─────────────────────────────────────────────────────────

function CreatePostViewInner({ editId }: { editId?: string }) {
  const navigate = useNavigate();
  const loaderData = useLoaderData<PGAnnouncement | null>();
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Type picker state — skip in edit mode, infer from loaded data
  const [selectedType, setSelectedType] = useState<'post' | 'post-with-response' | null>(() => {
    if (!editId) return null;
    if (loaderData && (loaderData.responseType === 'acknowledge' || loaderData.responseType === 'yes-no')) {
      return 'post-with-response';
    }
    return 'post';
  });

  // For edit mode, map loader data to form state
  const editData = loaderData ? announcementToFormState(loaderData) : null;

  const [state, dispatch] = useReducer(
    formReducer,
    editData ?? INITIAL_STATE,
  );

  const deferredState = useDeferredValue(state);
  const isFormValid = state.title.trim().length > 0;
  const recipientCount = getRecipientCount(state.selectedClasses);
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
        content: state.description
          .split('\n')
          .map((line) => ({
            type: 'paragraph',
            attrs: { textAlign: 'left' },
            content: line ? [{ type: 'text', text: line }] : [],
          })),
      }),
      enquiryEmailAddress: state.enquiryEmail || undefined,
      recipients: {
        classIds: state.selectedClasses.map((c) =>
          MOCK_CLASSES.findIndex((mc) => mc.id === c) + 100,
        ),
        customGroupIds: [],
        ccaIds: [],
        levelIds: [],
      },
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
      navigate('/posts');
    } catch {
      alert('Failed to send post. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  // ── Type picker (shown before form) ────────────────────────────────────
  if (!selectedType) {
    return (
      <div className="flex flex-col">
        {/* Minimal header */}
        <div className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur-sm px-6 py-3">
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
      <div className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur-sm px-6 py-3">
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
              <Eye className="h-4 w-4 mr-1.5" />
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
      <div className="flex gap-8 px-6 py-6 justify-center">
        {/* Form column */}
        <div className="flex-1 max-w-2xl space-y-6">
          {/* RECIPIENTS Card */}
          <Card>
            <CardContent className="p-6 space-y-5">
              <Typography variant="label-sm" className="text-muted-foreground uppercase tracking-widest">
                Recipients
              </Typography>

              {/* Students field */}
              <div className="space-y-1.5">
                <Label>Students <span className="text-red-500">*</span></Label>
                <Typography variant="body-sm" className="text-muted-foreground">
                  Parents of the selected students will receive this post via Parents Gateway.
                </Typography>
                <RecipientSelector
                  classes={MOCK_CLASSES}
                  selectedClasses={state.selectedClasses}
                  onToggleClass={(classId) =>
                    dispatch({ type: 'TOGGLE_CLASS', payload: classId })
                  }
                />
              </div>

              {/* Staff in charge */}
              <div className="space-y-1.5">
                <Label>Staff in charge</Label>
                <Typography variant="body-sm" className="text-muted-foreground">
                  These staff will be able to view read status, and delete the post.
                </Typography>
                <Select
                  value={state.staffInCharge}
                  onValueChange={(value) =>
                    dispatch({ type: 'SET_STAFF', payload: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_STAFF.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name} ({staff.department})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Enquiry email */}
              <div className="space-y-1.5">
                <Label>Enquiry email</Label>
                <Typography variant="body-sm" className="text-muted-foreground">
                  Select the preferred email address to receive enquiries from parents.
                </Typography>
                <Select
                  value={state.enquiryEmail}
                  onValueChange={(value) =>
                    dispatch({ type: 'SET_EMAIL', payload: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select enquiry email" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_EMAILS.map((email) => (
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
            <CardContent className="p-6 space-y-5">
              <Typography variant="label-sm" className="text-muted-foreground uppercase tracking-widest">
                Content
              </Typography>

              {/* Title with counter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="post-title">Title <span className="text-red-500">*</span></Label>
                  <Typography variant="body-sm" className="text-muted-foreground">
                    {state.title.length}/120
                  </Typography>
                </div>
                <Input
                  id="post-title"
                  placeholder="e.g. Term 3 School Camp Consent & Payment"
                  value={state.title}
                  maxLength={120}
                  onChange={(e) =>
                    dispatch({ type: 'SET_TITLE', payload: e.target.value })
                  }
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
                    className="rounded-t-none min-h-[120px]"
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
              <CardContent className="p-6 space-y-5">
                <Typography variant="label-sm" className="text-muted-foreground uppercase tracking-widest">
                  Response
                </Typography>

                <div className="space-y-4">
                  <ResponseTypeSelector
                    value={state.responseType}
                    onChange={(value) =>
                      dispatch({ type: 'SET_RESPONSE_TYPE', payload: value })
                    }
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
        <div className="hidden lg:block w-[320px] shrink-0">
          <div className="sticky top-[72px]">
            <Typography
              variant="body-sm"
              className="mb-3 font-medium text-muted-foreground"
            >
              Preview
            </Typography>
            <PostPreview formState={deferredState} />
          </div>
        </div>
      </div>

      {/* Mobile preview */}
      {showMobilePreview && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden">
          <div className="absolute right-0 top-0 bottom-0 w-[340px] bg-white p-4 shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <Typography variant="body-sm" className="font-medium">
                Preview
              </Typography>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobilePreview(false)}
              >
                Close
              </Button>
            </div>
            <PostPreview formState={deferredState} />
          </div>
        </div>
      )}

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
export type { PostFormState, PostFormAction };
