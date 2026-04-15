import type { PGApiSchoolClass, PGApiSchoolStudent } from '~/api/types';

import { EntitySelector } from './entity-selector';
import type { EntityItem, EntityScope, SearchResults, SelectedEntity } from './entity-selector';

export type { SelectedEntity as SelectedRecipient };

interface StudentRecipientSelectorProps {
  value: SelectedEntity[];
  onChange: (recipients: SelectedEntity[]) => void;
  classes: PGApiSchoolClass[];
  students: PGApiSchoolStudent[];
}

// Classes from /school/groups use labels like "P6 BEST (2026)"; students'
// className drops the year — strip it to match.
function stripYear(label: string): string {
  return label.replace(/ \(\d{4}\)$/, '');
}

export function StudentRecipientSelector({
  value,
  onChange,
  classes,
  students,
}: StudentRecipientSelectorProps) {
  const byClassName = new Map<string, PGApiSchoolStudent[]>();
  for (const s of students) {
    const list = byClassName.get(s.className) ?? [];
    list.push(s);
    byClassName.set(s.className, list);
  }

  const classItems: EntityItem[] = classes.map((c) => {
    const roster = byClassName.get(stripYear(c.label)) ?? [];
    return {
      id: c.value.toString(),
      label: c.label,
      type: 'group',
      count: roster.length,
      memberNames: roster.map((s) => s.studentName),
      memberDetails: roster.map((s) => ({
        name: s.studentName,
        sublabel: s.uinFinNo,
      })),
      groupType: 'class',
    };
  });

  const individualItems: EntityItem[] = students.map((s) => ({
    id: s.studentId.toString(),
    label: s.studentName,
    sublabel: `${s.className} · ${s.uinFinNo}`,
    type: 'individual',
    count: 1,
  }));

  // Level / CCA / Teaching Group / My Groups will populate when those
  // endpoints are wired. Leaving the tabs in place so the UX matches the
  // prototype and we can fill them incrementally.
  const scopes: EntityScope[] = [
    { id: 'class', label: 'Class', items: classItems },
    { id: 'level', label: 'Level/School', items: [] },
    { id: 'cca', label: 'CCA', items: [] },
    { id: 'teaching', label: 'Teaching Group', items: [] },
    { id: 'my-groups', label: 'My Groups', items: [] },
  ];

  function searchFn(query: string): SearchResults {
    const q = query.toLowerCase();
    if (!q) return { groups: classItems, individuals: individualItems };
    return {
      groups: classItems.filter((g) => g.label.toLowerCase().includes(q)),
      individuals: individualItems
        .filter(
          (s) =>
            s.label.toLowerCase().includes(q) || (s.sublabel?.toLowerCase().includes(q) ?? false),
        )
        .slice(0, 20),
    };
  }

  return (
    <EntitySelector
      value={value}
      onChange={onChange}
      scopes={scopes}
      searchFn={searchFn}
      placeholder="Search students, classes, CCAs…"
      searchPlaceholder="Search by name, class, or group…"
      noResultsText="No students or groups found"
      emptyTabText="No items in this category"
    />
  );
}
