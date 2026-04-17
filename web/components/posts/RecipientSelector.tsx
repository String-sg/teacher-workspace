import { Badge, Checkbox } from '~/components/ui';

interface ClassOption {
  id: string;
  label: string;
  students: string[];
}

interface RecipientSelectorProps {
  classes: ClassOption[];
  selectedClasses: string[];
  onToggleClass: (classId: string) => void;
}

function RecipientSelector({ classes, selectedClasses, onToggleClass }: RecipientSelectorProps) {
  const totalStudents = classes
    .filter((c) => selectedClasses.includes(c.id))
    .reduce((sum, c) => sum + c.students.length, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">Selected</p>
        <Badge variant="secondary">{totalStudents} students</Badge>
      </div>

      <div className="space-y-4 rounded-xl border p-4">
        {classes.map((cls) => {
          const isSelected = selectedClasses.includes(cls.id);
          return (
            <div key={cls.id} className="space-y-2">
              <label className="flex cursor-pointer items-center gap-3">
                <Checkbox checked={isSelected} onCheckedChange={() => onToggleClass(cls.id)} />
                <span className="font-medium">{cls.label}</span>
                <span className="text-sm text-muted-foreground">
                  ({cls.students.length} students)
                </span>
              </label>

              {isSelected && (
                <div className="ml-8">
                  <p className="text-sm text-muted-foreground">{cls.students.join(', ')}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { RecipientSelector };
export type { RecipientSelectorProps };
