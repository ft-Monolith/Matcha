import { SEXUAL_PREFS, type SexualPref } from "@common/constant/profile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/ui/select";
import { PREF_LABEL } from "./labels";

interface SexualPrefSelectProps {
  value: SexualPref;
  onChange: (value: SexualPref) => void;
}

export function SexualPrefSelect({ value, onChange }: SexualPrefSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SexualPref)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select preference" />
      </SelectTrigger>
      <SelectContent>
        {SEXUAL_PREFS.map((p) => (
          <SelectItem key={p} value={p}>
            {PREF_LABEL[p]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
