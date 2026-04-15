import type { PGApiSchoolStaff } from '~/api/types';

import { EntitySelector } from './entity-selector';
import type { EntityItem, EntityScope, SearchResults, SelectedEntity } from './entity-selector';

export type { SelectedEntity as SelectedStaff };

interface StaffSelectorProps {
  value: SelectedEntity[];
  onChange: (staff: SelectedEntity[]) => void;
  staff: PGApiSchoolStaff[];
}

export function StaffSelector({ value, onChange, staff }: StaffSelectorProps) {
  const individualItems: EntityItem[] = staff.map((s) => ({
    id: s.staffId.toString(),
    label: s.name,
    sublabel: [s.className, s.email].filter(Boolean).join(' · '),
    type: 'individual',
    count: 1,
  }));

  // Level / School staff-group tabs stay empty until pgw-web exposes
  // department/level-team membership.
  const scopes: EntityScope[] = [
    { id: 'individual', label: 'Individual', items: individualItems },
    { id: 'level', label: 'Level', items: [] },
    { id: 'school', label: 'School', items: [] },
  ];

  function searchFn(query: string): SearchResults {
    const q = query.toLowerCase();
    if (!q) return { groups: [], individuals: individualItems };
    return {
      groups: [],
      individuals: individualItems.filter(
        (s) =>
          s.label.toLowerCase().includes(q) || (s.sublabel?.toLowerCase().includes(q) ?? false),
      ),
    };
  }

  return (
    <EntitySelector
      value={value}
      onChange={onChange}
      scopes={scopes}
      searchFn={searchFn}
      placeholder="Search staff by name or group…"
      searchPlaceholder="Search staff…"
      noResultsText="No staff found"
    />
  );
}
