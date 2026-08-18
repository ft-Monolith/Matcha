import { useCallback, useState } from "react";
import type { SearchParams, SortField, SortOrder } from "@common/dto/search.dto";
import { API } from "@web/API/api";
import { ProfileList } from "@web/component/ProfileList";
import { TagPicker } from "@web/component/fields/TagPicker";
import { Button } from "@shadcn/ui/button";
import { Input } from "@shadcn/ui/input";
import { Label } from "@shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/ui/select";

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

export function SearchView() {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [applied, setApplied] = useState<SearchParams>(toParams(EMPTY));

  const fetchPage = useCallback(
    (limit: number, offset: number) => API.profiles.search({ ...applied, limit, offset }),
    [applied],
  );

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Age min</Label>
            <Input type="number" value={draft.ageMin} onChange={(e) => set("ageMin", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Age max</Label>
            <Input type="number" value={draft.ageMax} onChange={(e) => set("ageMax", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Fame min</Label>
            <Input type="number" value={draft.fameMin} onChange={(e) => set("fameMin", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Fame max</Label>
            <Input type="number" value={draft.fameMax} onChange={(e) => set("fameMax", e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Max distance (km)</Label>
            <Input
              type="number"
              value={draft.maxDistance}
              onChange={(e) => set("maxDistance", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label>Tags</Label>
          <TagPicker value={draft.tags} onChange={(v) => set("tags", v)} />
        </div>

        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label>Sort by</Label>
            <Select value={draft.sort} onValueChange={(v) => set("sort", v as SortField)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
          <div className="flex-1" />
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setDraft(EMPTY);
              setApplied(toParams(EMPTY));
            }}
          >
            Reset
          </Button>
          <Button type="button" onClick={() => setApplied(toParams(draft))}>
            Search
          </Button>
        </div>
      </div>

      <ProfileList fetchPage={fetchPage} emptyMessage="No profiles match your search." />
    </div>
  );
}
