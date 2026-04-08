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
import { PostPreview } from '~/components/comms/PostPreview';
import { QuestionBuilder } from '~/components/comms/QuestionBuilder';
import { RecipientSelector } from '~/components/comms/RecipientSelector';
import { ResponseTypeSelector } from '~/components/comms/ResponseTypeSelector';
import { SendConfirmationDialog } from '~/components/comms/SendConfirmationDialog';
import {
  Button,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
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

const PG_SHORTCUTS = [
  {
    id: 'travel',
    label: 'Travel Declaration',
    emoji: '\u2708\uFE0F',
    url: 'https://pg.moe.edu.sg/travel',
  },
  {
    id: 'contact',
    label: 'Contact Details',
    emoji: '\uD83E\uDDD1',
    url: 'https://pg.moe.edu.sg/contact',
  },
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
  selectedShortcuts: string[];
  staffInCharge: string;
  enquiryEmail: string;
  dueDate: string;
}

type PostFormAction =
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_DESCRIPTION'; payload: string }
  | { type: 'SET_RESPONSE_TYPE'; payload: ResponseType }
  | { type: 'SET_CLASSES'; payload: string[] }
  | { type: 'TOGGLE_CLASS'; payload: string }
  | { type: 'ADD_QUESTION' }
  | { type: 'UPDATE_QUESTION'; id: string; payload: Partial<FormQuestion> }
  | { type: 'REMOVE_QUESTION'; id: string }
  | { type: 'MOVE_QUESTION'; id: string; direction: 'up' | 'down' }
  | { type: 'TOGGLE_SHORTCUT'; id: string }
  | { type: 'SET_STAFF'; payload: string }
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_DUE_DATE'; payload: string }
  | { type: 'RESET'; payload?: PostFormState };

const INITIAL_STATE: PostFormState = {
  title: '',
  description: '',
  selectedClasses: [],
  responseType: 'view-only',
  questions: [],
  selectedShortcuts: [],
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

    case 'SET_CLASSES':
      return { ...state, selectedClasses: action.payload };

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

    case 'TOGGLE_SHORTCUT': {
      const id = action.id;
      const shortcuts = state.selectedShortcuts.includes(id)
        ? state.selectedShortcuts.filter((s) => s !== id)
        : [...state.selectedShortcuts, id];
      return { ...state, selectedShortcuts: shortcuts };
    }

    case 'SET_STAFF':
      return { ...state, staffInCharge: action.payload };

    case 'SET_EMAIL':
      return { ...state, enquiryEmail: action.payload };

    case 'SET_DUE_DATE':
      return { ...state, dueDate: action.payload };

    case 'RESET':
      return action.payload ?? INITIAL_STATE;

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
    selectedShortcuts: announcement.shortcuts?.map((s) => s.id) ?? [],
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

  // For edit mode, map loader data to form state
  const editData = loaderData ? announcementToFormState(loaderData) : null;

  // If editing but API returned nothing, redirect
  if (editId && !editData) {
    return <Navigate to="/posts" replace />;
  }

  const [state, dispatch] = useReducer(
    formReducer,
    editData ?? INITIAL_STATE,
  );

  const deferredState = useDeferredValue(state);
  const isFormValid = state.title.trim().length > 0;
  const recipientCount = getRecipientCount(state.selectedClasses);
  const isEditing = Boolean(editId);

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

  function handleSaveDraft() {
    const payload = buildPayload();
    if (isEditing && editId) {
      updateDraft(Number(editId), payload).catch(() => {});
    } else {
      createDraft(payload).catch(() => {});
    }
    alert('Draft saved');
    navigate('/posts');
  }

  function handleSendConfirm() {
    setShowSendDialog(false);
    const payload = buildPayload();
    createAnnouncement(payload).catch(() => {});
    alert('Post sent successfully');
    navigate('/posts');
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <Link
            to="/posts"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Posts
          </Link>

          <div className="flex items-center gap-2">
            {/* Mobile preview toggle */}
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowMobilePreview((prev) => !prev)}
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={!isFormValid}
              onClick={handleSaveDraft}
            >
              Save Draft
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={!isFormValid}
              onClick={() => setShowSendDialog(true)}
            >
              {isEditing ? 'Update & Send' : 'Send'}
            </Button>
          </div>
        </div>

        <Typography variant="title-lg" className="mt-2" asChild>
          <h1>{isEditing ? 'Edit Post' : 'Create Post'}</h1>
        </Typography>
      </div>

      {/* Body */}
      <div className="flex gap-8 px-6 py-6">
        {/* Left column: Form */}
        <div className="flex-1 max-w-[640px] space-y-8">
          {/* Section 1: Title & Description */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="post-title">Title</Label>
              <Input
                id="post-title"
                placeholder="Enter post title"
                value={state.title}
                onChange={(e) =>
                  dispatch({ type: 'SET_TITLE', payload: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-description">Description</Label>
              <Textarea
                id="post-description"
                placeholder="Enter post description"
                value={state.description}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_DESCRIPTION',
                    payload: e.target.value,
                  })
                }
                className="min-h-[120px]"
              />
            </div>
          </div>

          <Separator />

          {/* Section 2: Recipients */}
          <div className="space-y-4">
            <Label>Recipients</Label>
            <RecipientSelector
              classes={MOCK_CLASSES}
              selectedClasses={state.selectedClasses}
              onToggleClass={(classId) =>
                dispatch({ type: 'TOGGLE_CLASS', payload: classId })
              }
            />
          </div>

          <Separator />

          {/* Section 3: Response Type */}
          <div className="space-y-4">
            <Label>Response Type</Label>
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

          <Separator />

          {/* Section 4: Additional Options */}
          <div className="space-y-6">
            {/* PG Shortcuts */}
            <div className="space-y-3">
              <Label>PG Shortcuts</Label>
              <div className="flex flex-wrap gap-4">
                {PG_SHORTCUTS.map((shortcut) => (
                  <label
                    key={shortcut.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={state.selectedShortcuts.includes(shortcut.id)}
                      onCheckedChange={() =>
                        dispatch({ type: 'TOGGLE_SHORTCUT', id: shortcut.id })
                      }
                    />
                    <Typography variant="body-sm">
                      {shortcut.emoji} {shortcut.label}
                    </Typography>
                  </label>
                ))}
              </div>
            </div>

            {/* Staff in Charge */}
            <div className="space-y-2">
              <Label htmlFor="staff-select">Staff in Charge</Label>
              <Select
                value={state.staffInCharge}
                onValueChange={(value) =>
                  dispatch({ type: 'SET_STAFF', payload: value })
                }
              >
                <SelectTrigger id="staff-select" className="max-w-[320px]">
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

            {/* Enquiry Email */}
            <div className="space-y-2">
              <Label htmlFor="email-select">Enquiry Email</Label>
              <Select
                value={state.enquiryEmail}
                onValueChange={(value) =>
                  dispatch({ type: 'SET_EMAIL', payload: value })
                }
              >
                <SelectTrigger id="email-select" className="max-w-[320px]">
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
          </div>
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
