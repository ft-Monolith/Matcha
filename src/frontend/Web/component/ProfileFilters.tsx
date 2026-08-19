import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  clampRange,
  SEARCH_AGE_MAX,
  SEARCH_AGE_MIN,
  SEARCH_DISTANCE_MAX,
  SEARCH_DISTANCE_MIN,
  SEARCH_FAME_MAX,
  SEARCH_FAME_MIN,
  type SearchParams,
  type SortField,
  type SortOrder,
} from "@common/dto/search.dto";
import { TagPicker } from "@web/component/fields/TagPicker";
import { Badge } from "@shadcn/ui/badge";
import { Button } from "@shadcn/ui/button";
import { Input } from "@shadcn/ui/input";
import { Label } from "@shadcn/ui/label";
import { Switch } from "@shadcn/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@shadcn/ui/drawer";

export interface ProfileFiltersValue {
  ageMin: string;
  ageMax: string;
  fameMin: string;
  fameMax: string;
  maxDistance: string;
  tags: string[];
  hideFlagged: boolean;
  sort: SortField;
  order: SortOrder;
}

export const EMPTY_FILTERS: ProfileFiltersValue = {
  ageMin: "",
  ageMax: "",
  fameMin: "",
  fameMax: "",
  maxDistance: "",
  tags: [],
  hideFlagged: true,
  sort: "suggestion",
  order: "desc",
};

function num(s: string, min: number, max: number): number | undefined {
  const n = Number(s);
  if (s.trim() === "" || !Number.isFinite(n)) return undefined;
  return clampRange(Math.trunc(n), min, max);
}

export function toSearchParams(v: ProfileFiltersValue): SearchParams {
  let ageMin = num(v.ageMin, SEARCH_AGE_MIN, SEARCH_AGE_MAX);
  let ageMax = num(v.ageMax, SEARCH_AGE_MIN, SEARCH_AGE_MAX);
  if (ageMin !== undefined && ageMax !== undefined && ageMin > ageMax) {
    [ageMin, ageMax] = [ageMax, ageMin];
  }

  let fameMin = num(v.fameMin, SEARCH_FAME_MIN, SEARCH_FAME_MAX);
  let fameMax = num(v.fameMax, SEARCH_FAME_MIN, SEARCH_FAME_MAX);
  if (fameMin !== undefined && fameMax !== undefined && fameMin > fameMax) {
    [fameMin, fameMax] = [fameMax, fameMin];
  }

  return {
    ageMin,
    ageMax,
    fameMin,
    fameMax,
    maxDistance: num(v.maxDistance, SEARCH_DISTANCE_MIN, SEARCH_DISTANCE_MAX),
    tags: v.tags,
    hideFlagged: v.hideFlagged,
    sort: v.sort,
    order: v.order,
  };
}

export function countActiveFilters(p: SearchParams): number {
  let n = 0;
  if (p.ageMin !== undefined) n++;
  if (p.ageMax !== undefined) n++;
  if (p.fameMin !== undefined) n++;
  if (p.fameMax !== undefined) n++;
  if (p.maxDistance !== undefined) n++;
  if (p.tags && p.tags.length > 0) n++;
  return n;
}

interface ProfileFiltersProps {
  value: ProfileFiltersValue;
  onChange: (value: ProfileFiltersValue) => void;
  activeCount: number;
  onApply: () => void;
  onReset: () => void;
}

export function ProfileFilters({
  value,
  onChange,
  activeCount,
  onApply,
  onReset,
}: ProfileFiltersProps) {
  const [open, setOpen] = useState(false);

  function set<K extends keyof ProfileFiltersValue>(key: K, v: ProfileFiltersValue[K]) {
    onChange({ ...value, [key]: v });
  }

  function apply() {
    onApply();
    setOpen(false);
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline">
            <SlidersHorizontal className="size-4" />
            Filters
            {activeCount > 0 && (
              <Badge className="ml-1 size-5 justify-center rounded-full px-0 tabular-nums">
                {activeCount}
              </Badge>
            )}
          </Button>
        </DrawerTrigger>

        <DrawerContent>
          <div className="mx-auto flex w-full max-w-md flex-col overflow-hidden">
            <DrawerHeader>
              <DrawerTitle>Filters &amp; sort</DrawerTitle>
            </DrawerHeader>

            <div className="space-y-5 overflow-y-auto overscroll-contain px-4 pb-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Age min</Label>
                  <Input type="number" min={SEARCH_AGE_MIN} max={SEARCH_AGE_MAX} value={value.ageMin} onChange={(e) => set("ageMin", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Age max</Label>
                  <Input type="number" min={SEARCH_AGE_MIN} max={SEARCH_AGE_MAX} value={value.ageMax} onChange={(e) => set("ageMax", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Fame min</Label>
                  <Input type="number" min={SEARCH_FAME_MIN} max={SEARCH_FAME_MAX} value={value.fameMin} onChange={(e) => set("fameMin", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Fame max</Label>
                  <Input type="number" min={SEARCH_FAME_MIN} max={SEARCH_FAME_MAX} value={value.fameMax} onChange={(e) => set("fameMax", e.target.value)} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Max distance (km)</Label>
                  <Input
                    type="number"
                    min={SEARCH_DISTANCE_MIN}
                    max={SEARCH_DISTANCE_MAX}
                    value={value.maxDistance}
                    onChange={(e) => set("maxDistance", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Tags</Label>
                <TagPicker value={value.tags} onChange={(v) => set("tags", v)} />
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label>Sort by</Label>
                  <Select value={value.sort} onValueChange={(v) => set("sort", v as SortField)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="suggestion">Relevance</SelectItem>
                      <SelectItem value="fame">Fame</SelectItem>
                      <SelectItem value="distance">Distance</SelectItem>
                      <SelectItem value="age">Age</SelectItem>
                      <SelectItem value="tags">Common tags</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => set("order", value.order === "asc" ? "desc" : "asc")}
                >
                  {value.order === "asc" ? "↑ Asc" : "↓ Desc"}
                </Button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <Label htmlFor="hideFlagged">Hide flagged profiles</Label>
                  <p className="text-muted-foreground text-xs">
                    Reported fake accounts (negative fame).
                  </p>
                </div>
                <Switch
                  id="hideFlagged"
                  checked={value.hideFlagged}
                  onCheckedChange={(v) => set("hideFlagged", v)}
                />
              </div>
            </div>

            <DrawerFooter className="flex-row gap-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={onReset}>
                Reset
              </Button>
              <Button type="button" className="flex-1" onClick={apply}>
                Apply
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={onReset}
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-2 hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
