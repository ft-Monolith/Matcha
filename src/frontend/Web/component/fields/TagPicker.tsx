import { PREDEFINED_TAGS } from "@common/constant/tags";
import { Badge } from "@shadcn/ui/badge";

interface TagPickerProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function TagPicker({ value, onChange }: TagPickerProps) {
  function toggle(tag: string) {
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PREDEFINED_TAGS.map((tag) => {
        const selected = value.includes(tag);
        return (
          <Badge
            key={tag}
            variant={selected ? "default" : "outline"}
            className="cursor-pointer select-none"
            onClick={() => toggle(tag)}
          >
            #{tag}
          </Badge>
        );
      })}
    </div>
  );
}
