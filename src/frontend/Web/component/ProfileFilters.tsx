import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { SearchParams, SortField, SortOrder } from "@common/dto/search.dto";
import { TagPicker } from "@web/component/fields/TagPicker";
import { Badge } from "@shadcn/ui/badge";
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
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@shadcn/ui/drawer";

/**
 * Critères de filtrage et de tri partagés par Browse et Search.
 * Sujet IV.3 et IV.4 : âge, localisation (distance), note de popularité, tags communs.
 *
 * Les nombres sont conservés en `string` : c'est ce que renvoie un <Input>, et ça
 * distingue un champ vide (`""`) d'un zéro volontaire.
 */
export interface ProfileFiltersValue {
  ageMin: string;
  ageMax: string;
  fameMin: string;
  fameMax: string;
  maxDistance: string;
  tags: string[];
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
  sort: "suggestion",
  order: "desc",
};

function num(s: string): number | undefined {
  const n = Number(s);
  return s.trim() !== "" && Number.isFinite(n) ? n : undefined;
}

/** Convertit les champs du formulaire en paramètres d'API. */
export function toSearchParams(v: ProfileFiltersValue): SearchParams {
  return {
    ageMin: num(v.ageMin),
    ageMax: num(v.ageMax),
    fameMin: num(v.fameMin),
    fameMax: num(v.fameMax),
    maxDistance: num(v.maxDistance),
    tags: v.tags,
    sort: v.sort,
    order: v.order,
  };
}

/** Nombre de filtres réellement actifs, pour le badge du bouton. */
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
  /** Le brouillon en cours d'édition (le parent en est propriétaire). */
  value: ProfileFiltersValue;
  onChange: (value: ProfileFiltersValue) => void;
  /** Nombre de filtres appliqués, pour le badge — cf. countActiveFilters(). */
  activeCount: number;
  /** Appelé quand l'utilisateur valide : le parent applique le brouillon. */
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
                  <Input type="number" value={value.ageMin} onChange={(e) => set("ageMin", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Age max</Label>
                  <Input type="number" value={value.ageMax} onChange={(e) => set("ageMax", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Fame min</Label>
                  <Input type="number" value={value.fameMin} onChange={(e) => set("fameMin", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Fame max</Label>
                  <Input type="number" value={value.fameMax} onChange={(e) => set("fameMax", e.target.value)} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Max distance (km)</Label>
                  <Input
                    type="number"
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
