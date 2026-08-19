import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { MIN_AGE, MAX_AGE } from "@common/utils/age_rules";
import { Button } from "@shadcn/ui/button";
import { Calendar } from "@shadcn/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@shadcn/ui/popover";
import { cn } from "@shadcn/lib/utils";

interface BirthdateFieldProps {
  value: string | undefined; // "YYYY-MM-DD"
  onChange: (value: string) => void;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function parseLocal(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function toISO(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function subtractYears(date: Date, years: number): Date {
  return new Date(date.getFullYear() - years, date.getMonth(), date.getDate());
}

export function BirthdateField({ value, onChange }: BirthdateFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = parseLocal(value);

  const today = new Date();
  const maxDate = subtractYears(today, MIN_AGE);
  const minDate = subtractYears(today, MAX_AGE);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="size-4" />
          {selected
            ? selected.toLocaleDateString(undefined, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "Select your birthdate"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? maxDate}
          startMonth={minDate}
          endMonth={maxDate}
          captionLayout="dropdown"
          disabled={{ before: minDate, after: maxDate }}
          onSelect={(date: Date | undefined) => {
            if (!date) return;
            onChange(toISO(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
