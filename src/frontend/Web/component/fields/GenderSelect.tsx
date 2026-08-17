import { GENDERS, type Gender } from "@common/constant/profile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/ui/select";
import { GENDER_LABEL } from "./labels";

interface GenderSelectProps {
  value: Gender | undefined;
  onChange: (value: Gender) => void;
}

export function GenderSelect({ value, onChange }: GenderSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Gender)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select gender" />
      </SelectTrigger>
      <SelectContent>
        {GENDERS.map((g) => (
          <SelectItem key={g} value={g}>
            {GENDER_LABEL[g]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
