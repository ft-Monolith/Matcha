import { Input } from "@shadcn/ui/input";

interface BirthdateFieldProps {
  value: string | undefined; // "YYYY-MM-DD"
  onChange: (value: string) => void;
}

export function BirthdateField({ value, onChange }: BirthdateFieldProps) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Input
      type="date"
      max={today}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
