import { Textarea } from "@shadcn/ui/textarea";

const MAX_BIO = 1000;

interface BioFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function BioField({ value, onChange }: BioFieldProps) {
  return (
    <div className="space-y-1">
      <Textarea
        placeholder="Tell something about yourself…"
        maxLength={MAX_BIO}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="text-muted-foreground text-right text-xs">
        {value.length}/{MAX_BIO}
      </p>
    </div>
  );
}
