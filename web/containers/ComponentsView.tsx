import { Mail, Plus, Upload } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { AnnouncementCard } from '~/components/posts/AnnouncementCard';
import { AttachmentSection } from '~/components/posts/AttachmentSection';
import { PostTypePicker, type PostKind } from '~/components/posts/PostTypePicker';
import { ReadRate } from '~/components/posts/ReadRate';
import { ReadTrackingCards } from '~/components/posts/ReadTrackingCards';
import { RecipientSelector } from '~/components/posts/RecipientSelector';
import { ResponseTypeSelector } from '~/components/posts/ResponseTypeSelector';
import { RichTextEditor } from '~/components/posts/RichTextEditor';
import { SchedulePickerDialog } from '~/components/posts/SchedulePickerDialog';
import { SendConfirmationDialog } from '~/components/posts/SendConfirmationDialog';
import { SplitPostButton } from '~/components/posts/SplitPostButton';
import { StatusBadge } from '~/components/posts/StatusBadge';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '~/components/ui';
import type { ResponseType } from '~/data/mock-pg-announcements';
import { cn } from '~/lib/utils';

const DEMO_CLASSES = [
  { id: '4a', label: '4A', students: ['Aiden Tan', 'Bella Lim', 'Chen Wei'] },
  { id: '4b', label: '4B', students: ['Dinesh Rao', 'Eva Ng'] },
];

const DEMO_STATS = {
  totalCount: 32,
  readCount: 24,
  responseCount: 19,
  yesCount: 15,
  noCount: 4,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Subsection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

// Every color token declared in `web/App.css`. The default mapping mirrors
// the `:root` declarations there so the table opens in its shipped state.
const SHADCN_DEFAULTS = {
  background: '#ffffff',
  foreground: 'var(--slate-12)',
  card: '#ffffff',
  'card-foreground': 'var(--slate-12)',
  popover: '#ffffff',
  'popover-foreground': 'var(--slate-12)',
  primary: 'var(--twblue-9)',
  'primary-foreground': '#ffffff',
  secondary: 'var(--slate-3)',
  'secondary-foreground': 'var(--slate-12)',
  muted: 'var(--slate-3)',
  'muted-foreground': 'var(--slate-11)',
  accent: 'var(--slate-4)',
  'accent-foreground': 'var(--slate-12)',
  destructive: 'var(--red-9)',
  'destructive-foreground': '#ffffff',
  border: 'var(--slate-6)',
  input: 'var(--slate-7)',
  ring: 'var(--twblue-8)',
} as const satisfies Record<string, string>;
type ShadcnToken = keyof typeof SHADCN_DEFAULTS;
const SHADCN_TOKENS = Object.keys(SHADCN_DEFAULTS) as ShadcnToken[];

const RADIX_SCALES = ['slate', 'twblue', 'blue', 'green', 'red', 'amber'] as const;
const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

const LITERAL_OPTIONS = [
  { value: '#ffffff', label: 'white (#ffffff)' },
  { value: 'transparent', label: 'transparent' },
];
const RADIX_OPTIONS = RADIX_SCALES.flatMap((scale) =>
  STEPS.map((step) => ({
    value: `var(--${scale}-${step})`,
    label: `${scale}-${step}`,
  })),
);
const ALL_OPTIONS = [...LITERAL_OPTIONS, ...RADIX_OPTIONS];

// Cell: step number rendered inside the swatch. Title attribute shows the full
// name on hover so tiny viewports don't lose the mapping.
function Swatch({
  label,
  title,
  style,
  tone,
}: {
  label: string | number;
  title: string;
  style: React.CSSProperties;
  tone: 'light' | 'dark';
}) {
  return (
    <div
      title={title}
      className={cn(
        'flex h-10 items-center justify-center rounded-md font-mono text-[11px] tabular-nums outline outline-offset-[-1px] outline-slate-6',
        tone === 'dark' ? 'text-slate-12' : 'text-white',
      )}
      style={style}
    >
      {label}
    </div>
  );
}

function ScaleRow({ scale }: { scale: string }) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-12">
      {STEPS.map((step) => (
        <Swatch
          key={step}
          label={step}
          title={`${scale}-${step}`}
          style={{ backgroundColor: `var(--${scale}-${step})` }}
          tone={step < 9 ? 'dark' : 'light'}
        />
      ))}
    </div>
  );
}

function ThemeMappingTable() {
  const [mappings, setMappings] = useState<Record<ShadcnToken, string>>(SHADCN_DEFAULTS);

  function formatCss() {
    return SHADCN_TOKENS.map((t) => `  --${t}: ${mappings[t]};`).join('\n');
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`:root {\n${formatCss()}\n}`);
      toast.success('Mapping copied to clipboard');
    } catch {
      toast.error('Copy failed');
    }
  }

  function handleReset() {
    setMappings(SHADCN_DEFAULTS);
  }

  const isDirty = SHADCN_TOKENS.some((t) => mappings[t] !== SHADCN_DEFAULTS[t]);

  return (
    <div className="space-y-4">
      {/* Column header — only on ≥md where the grid lays out as a table. */}
      <div className="hidden text-xs font-medium text-muted-foreground md:grid md:grid-cols-[minmax(12rem,14rem)_4rem_1fr] md:gap-4 md:px-1">
        <div>Token</div>
        <div>Preview</div>
        <div>Mapped to</div>
      </div>

      <ul className="divide-y divide-border border-y border-border md:border-0">
        {SHADCN_TOKENS.map((token) => (
          <li
            key={token}
            className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 py-3 md:grid-cols-[minmax(12rem,14rem)_4rem_1fr] md:gap-4 md:px-1"
          >
            <code className="text-xs">--{token}</code>

            <div
              className="h-6 w-12 justify-self-end rounded-md outline outline-offset-[-1px] outline-slate-6 md:justify-self-start"
              style={{ backgroundColor: mappings[token] }}
            />

            <div className="col-span-2 md:col-span-1">
              <Select
                value={mappings[token]}
                onValueChange={(v: string | null) => {
                  if (typeof v !== 'string') return;
                  setMappings((prev) => ({ ...prev, [token]: v }));
                }}
              >
                <SelectTrigger className="w-full md:max-w-[18rem]">
                  <SelectValue>
                    {(value) => {
                      const v = typeof value === 'string' ? value : '';
                      const opt = ALL_OPTIONS.find((o) => o.value === v);
                      return (
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-sm outline outline-offset-[-1px] outline-slate-6"
                            style={{ backgroundColor: v }}
                          />
                          <code className="text-xs">{opt?.label ?? v}</code>
                        </span>
                      );
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ALL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-sm outline outline-offset-[-1px] outline-slate-6"
                          style={{ backgroundColor: opt.value }}
                        />
                        <code className="text-xs">{opt.label}</code>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={handleReset} disabled={!isDirty}>
          Reset
        </Button>
        <Button onClick={handleCopy}>Copy mapping</Button>
      </div>
    </div>
  );
}

const ComponentsView: React.FC = () => {
  const [defaultTab, setDefaultTab] = useState('account');
  const [lineTab, setLineTab] = useState('overview');
  const [pickedType, setPickedType] = useState<PostKind | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(['4a']);
  const [responseType, setResponseType] = useState<ResponseType>('acknowledge');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [lastScheduledAt, setLastScheduledAt] = useState<string | null>(null);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-16 px-6 py-8">
      {/* ── Theme ───────────────────────────────────────────────── */}
      <Section title="Theme">
        <Subsection label="Semantic tokens (shadcn)">
          <ThemeMappingTable />
        </Subsection>

        {RADIX_SCALES.map((scale) => (
          <Subsection key={scale} label={scale}>
            <ScaleRow scale={scale} />
          </Subsection>
        ))}

        <Subsection label="Toast">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => toast('Default toast message')}>
              Default
            </Button>
            <Button variant="outline" onClick={() => toast.success('Saved changes')}>
              Success
            </Button>
            <Button variant="outline" onClick={() => toast.error('Something failed')}>
              Error
            </Button>
            <Button variant="outline" onClick={() => toast.info('Heads up')}>
              Info
            </Button>
          </div>
        </Subsection>
      </Section>

      {/* ── Button ──────────────────────────────────────────────── */}
      <Section title="Button">
        <Subsection label="Variants">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="default">default</Button>
            <Button variant="outline">outline</Button>
            <Button variant="secondary">secondary</Button>
            <Button variant="ghost">ghost</Button>
            <Button variant="destructive">destructive</Button>
            <Button variant="link">link</Button>
          </div>
        </Subsection>

        <Subsection label="Sizes">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="xs">xs</Button>
            <Button size="sm">sm</Button>
            <Button size="default">default</Button>
            <Button size="lg">lg</Button>
          </div>
        </Subsection>

        <Subsection label="Icon sizes">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="icon-xs" aria-label="Add">
              <Plus />
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="Add">
              <Plus />
            </Button>
            <Button variant="outline" size="icon" aria-label="Add">
              <Plus />
            </Button>
            <Button variant="outline" size="icon-lg" aria-label="Add">
              <Plus />
            </Button>
          </div>
        </Subsection>

        <Subsection label="With icons">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
            <Button>
              Save
              <Upload className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Subsection>

        <Subsection label="Disabled">
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled>Disabled</Button>
            <Button variant="outline" disabled>
              Disabled
            </Button>
          </div>
        </Subsection>
      </Section>

      {/* ── Badge ───────────────────────────────────────────────── */}
      <Section title="Badge">
        <Subsection label="Variants">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="default">default</Badge>
            <Badge variant="secondary">secondary</Badge>
            <Badge variant="destructive">destructive</Badge>
            <Badge variant="outline">outline</Badge>
          </div>
        </Subsection>
      </Section>

      {/* ── Card ────────────────────────────────────────────────── */}
      <Section title="Card">
        <div className="flex flex-wrap gap-6">
          <Card className="w-80">
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>Card with default size and padding.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Card content goes here.</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button>Save</Button>
            </CardFooter>
          </Card>

          <Card className="w-64">
            <CardHeader>
              <CardTitle>Small Card</CardTitle>
              <CardDescription>Compact card with size=&quot;sm&quot;.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Smaller padding and gaps.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>
        </div>
      </Section>

      {/* ── Input ───────────────────────────────────────────────── */}
      <Section title="Input">
        <Subsection label="Default Input">
          <Input placeholder="Enter text..." className="max-w-md" />
        </Subsection>

        <Subsection label="With InputGroup">
          <div className="relative max-w-md">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <Input placeholder="Search..." className="pl-9" />
          </div>
        </Subsection>

        <Subsection label="Disabled">
          <Input placeholder="Disabled input" disabled className="max-w-md" />
        </Subsection>
      </Section>

      {/* ── Checkbox & Switch ───────────────────────────────────── */}
      <Section title="Checkbox &amp; Switch">
        <Subsection label="Checkbox">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox id="unchecked" />
              <Label htmlFor="unchecked">Unchecked</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="checked" defaultChecked />
              <Label htmlFor="checked">Checked</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="indeterminate" indeterminate />
              <Label htmlFor="indeterminate">Indeterminate</Label>
            </div>
          </div>
        </Subsection>

        <Subsection label="Switch">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch id="switch-default" />
              <Label htmlFor="switch-default">Default</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="switch-checked" defaultChecked />
              <Label htmlFor="switch-checked">Checked</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="switch-small" />
              <Label htmlFor="switch-small">Small</Label>
            </div>
          </div>
        </Subsection>
      </Section>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <Section title="Tabs">
        <Subsection label="Default variant">
          <Tabs value={defaultTab} onValueChange={setDefaultTab}>
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="mt-4">
              <p className="text-sm">Account settings content.</p>
            </TabsContent>
            <TabsContent value="security" className="mt-4">
              <p className="text-sm">Security settings content.</p>
            </TabsContent>
            <TabsContent value="notifications" className="mt-4">
              <p className="text-sm">Notification preferences content.</p>
            </TabsContent>
          </Tabs>
        </Subsection>

        <Subsection label="Line variant">
          <div>
            <div className="flex gap-6 border-b">
              {['Overview', 'Analytics', 'Reports'].map((tab) => (
                <button
                  key={tab}
                  className={`pb-2 text-sm font-medium transition-colors ${
                    lineTab === tab.toLowerCase()
                      ? 'border-b-2 border-foreground text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setLineTab(tab.toLowerCase())}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-sm">
                {lineTab.charAt(0).toUpperCase() + lineTab.slice(1)} content.
              </p>
            </div>
          </div>
        </Subsection>
      </Section>

      {/* ── Post building blocks ────────────────────────────────── */}
      <Section title="Post building blocks">
        <Subsection label="StatusBadge">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status="posted" />
            <StatusBadge status="scheduled" />
            <StatusBadge status="draft" />
          </div>
        </Subsection>

        <Subsection label="ReadRate">
          <div className="flex flex-wrap items-center gap-6">
            <ReadRate readCount={24} totalCount={32} />
            <ReadRate readCount={0} totalCount={32} />
            <ReadRate readCount={0} totalCount={0} />
          </div>
        </Subsection>

        <Subsection label="AnnouncementCard">
          <AnnouncementCard
            className="max-w-sm"
            title="Term 2 Parent-Teacher Meeting"
            description="Dear parents, the term 2 PTM will be held on Saturday, 19 April. Please book a slot via Parents Gateway."
            enquiryEmail="ptm@school.edu.sg"
            staffInCharge="Ms Lee"
          />
        </Subsection>

        <Subsection label="AttachmentSection">
          <div className="max-w-md rounded-xl border p-4">
            <AttachmentSection />
          </div>
        </Subsection>

        <Subsection label="RichTextEditor">
          <div className="max-w-xl">
            <RichTextEditor placeholder="Rich text showcase." />
          </div>
        </Subsection>

        <Subsection label="SplitPostButton">
          <div className="flex flex-wrap items-center gap-4">
            <SplitPostButton
              onPost={() => window.alert('Post clicked')}
              onSchedule={() => setScheduleOpen(true)}
            />
            <SplitPostButton disabled onPost={() => window.alert('Post clicked')} />
          </div>
        </Subsection>

        <Subsection label="SchedulePickerDialog">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="outline" onClick={() => setScheduleOpen(true)}>
              Open schedule picker
            </Button>
            {lastScheduledAt && (
              <p className="text-sm text-muted-foreground" data-testid="schedule-last">
                Last confirmed: <code>{lastScheduledAt}</code>
              </p>
            )}
          </div>
          <SchedulePickerDialog
            open={scheduleOpen}
            onOpenChange={setScheduleOpen}
            onConfirm={(iso) => {
              setLastScheduledAt(iso);
              setScheduleOpen(false);
            }}
          />
        </Subsection>

        <Subsection label="PostTypePicker">
          <div className="rounded-xl border">
            <PostTypePicker onSelect={setPickedType} />
          </div>
          {pickedType && (
            <p className="text-sm text-muted-foreground">
              Picked: <code>{pickedType}</code>
            </p>
          )}
        </Subsection>
      </Section>

      {/* ── Post building blocks (PG-coupled) ───────────────────── */}
      <Section title="Post building blocks (PG-coupled)">
        <Subsection label="RecipientSelector">
          <RecipientSelector
            classes={DEMO_CLASSES}
            selectedClasses={selectedClasses}
            onToggleClass={(id) =>
              setSelectedClasses((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
              )
            }
          />
        </Subsection>

        <Subsection label="ResponseTypeSelector">
          <ResponseTypeSelector value={responseType} onChange={setResponseType} />
        </Subsection>

        <Subsection label="ReadTrackingCards">
          <ReadTrackingCards responseType={responseType} stats={DEMO_STATS} />
        </Subsection>

        <Subsection label="SendConfirmationDialog">
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            Open send confirmation
          </Button>
          <SendConfirmationDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            title="Term 2 Parent-Teacher Meeting"
            recipientCount={32}
            responseType={responseType}
            onConfirm={() => setDialogOpen(false)}
          />
        </Subsection>
      </Section>
    </div>
  );
};

export { ComponentsView as Component };
