import { useCallback, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { SearchParams, SortField, SortOrder } from "@common/dto/search.dto";
import { API } from "@web/API/api";
import { ProfileList } from "@web/component/ProfileList";
import { TagPicker } from "@web/component/fields/TagPicker";
import { Button } from "@shadcn/ui/button";
import { Badge } from "@shadcn/ui/badge";
import { Input } from "@shadcn/ui/input";
import { Label } from "@shadcn/ui/label";
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

interface Draft {
  ageMin: string;
  ageMax: string;
  fameMin: string;
  fameMax: string;
  maxDistance: string;
  tags: string[];
  sort: SortField;
  order: SortOrder;
}

const EMPTY: Draft = {
  ageMin: "",
  ageMax: "",
  fameMin: "",
  fameMax: "",
  maxDistance: "",
  tags: [],
  sort: "fame",
  order: "desc",
};

function num(s: string): number | undefined {
  const n = Number(s);
  return s.trim() !== "" && Number.isFinite(n) ? n : undefined;
}

function toParams(d: Draft): SearchParams {
  return {
    ageMin: num(d.ageMin),
    ageMax: num(d.ageMax),
    fameMin: num(d.fameMin),
    fameMax: num(d.fameMax),
    maxDistance: num(d.maxDistance),
    tags: d.tags,
    sort: d.sort,
    order: d.order,
  };
}

function countActive(p: SearchParams): number {
  let n = 0;
  if (p.ageMin !== undefined) n++;
  if (p.ageMax !== undefined) n++;
  if (p.fameMin !== undefined) n++;
  if (p.fameMax !== undefined) n++;
  if (p.maxDistance !== undefined) n++;
  if (p.tags && p.tags.length > 0) n++;
  return n;
}

export function SearchView() {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [applied, setApplied] = useState<SearchParams>(toParams(EMPTY));
  const [open, setOpen] = useState(false);

  const fetchPage = useCallback(
    (limit: number, offset: number) => API.profiles.search({ ...applied, limit, offset }),
    [applied],
  );

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function apply() {
    setApplied(toParams(draft));
    setOpen(false);
  }

  function reset() {
    setDraft(EMPTY);
    setApplied(toParams(EMPTY));
  }

  const activeCount = countActive(applied);

  return (
    <div className="space-y-4">
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
                    <Input type="number" value={draft.ageMin} onChange={(e) => set("ageMin", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Age max</Label>
                    <Input type="number" value={draft.ageMax} onChange={(e) => set("ageMax", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fame min</Label>
                    <Input type="number" value={draft.fameMin} onChange={(e) => set("fameMin", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fame max</Label>
                    <Input type="number" value={draft.fameMax} onChange={(e) => set("fameMax", e.target.value)} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Max distance (km)</Label>
                    <Input
                      type="number"
                      value={draft.maxDistance}
                      onChange={(e) => set("maxDistance", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Tags</Label>
                  <TagPicker value={draft.tags} onChange={(v) => set("tags", v)} />
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-1.5">
                    <Label>Sort by</Label>
                    <Select value={draft.sort} onValueChange={(v) => set("sort", v as SortField)}>
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
                    onClick={() => set("order", draft.order === "asc" ? "desc" : "asc")}
                  >
                    {draft.order === "asc" ? "↑ Asc" : "↓ Desc"}
                  </Button>
                </div>
              </div>

              <DrawerFooter className="flex-row gap-2">
                <Button type="button" variant="ghost" className="flex-1" onClick={reset}>
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
            onClick={reset}
            className="text-muted-foreground hover:text-foreground text-sm underline-offset-2 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <ProfileList fetchPage={fetchPage} emptyMessage="No profiles match your search." />
    </div>
  );
}
