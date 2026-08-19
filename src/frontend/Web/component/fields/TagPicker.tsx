import { PREDEFINED_TAGS, MAX_TAGS } from "@common/constant/tags";
import { Badge } from "@shadcn/ui/badge";
import { cn } from "@shadcn/lib/utils";

interface TagPickerProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function TagPicker({ value, onChange }: TagPickerProps) {
  const atLimit = value.length >= MAX_TAGS;

  function toggle(tag: string) {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag));
    } else if (!atLimit) {
      onChange([...value, tag]);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {PREDEFINED_TAGS.map((tag) => {
          const selected = value.includes(tag);
          const disabled = !selected && atLimit;
          return (
            <Badge
              key={tag}
              variant={selected ? "default" : "outline"}
              aria-disabled={disabled}
              className={cn(
                "select-none",
                disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
              )}
              onClick={() => toggle(tag)}
            >
              #{tag}
            </Badge>
          );
        })}
      </div>
      <p className="text-muted-foreground text-xs">
        {value.length}/{MAX_TAGS} tags selected
      </p>
    </div>
  );
}
