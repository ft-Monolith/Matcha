import { useCallback, useState } from "react";
import type { SearchParams } from "@common/dto/search.dto";
import { API } from "@web/API/api";
import { ProfileList } from "@web/component/ProfileList";
import {
  ProfileFilters,
  countActiveFilters,
  toSearchParams,
  EMPTY_FILTERS,
  type ProfileFiltersValue,
} from "@web/component/ProfileFilters";

/** La recherche part des profils les plus populaires (sujet IV.4). */
const SEARCH_FILTERS: ProfileFiltersValue = { ...EMPTY_FILTERS, sort: "fame" };

export function SearchView() {
  const [draft, setDraft] = useState<ProfileFiltersValue>(SEARCH_FILTERS);
  const [applied, setApplied] = useState<SearchParams>(toSearchParams(SEARCH_FILTERS));

  const fetchPage = useCallback(
    (limit: number, offset: number) => API.profiles.search({ ...applied, limit, offset }),
    [applied],
  );

  function reset() {
    setDraft(SEARCH_FILTERS);
    setApplied(toSearchParams(SEARCH_FILTERS));
  }

  return (
    <div className="space-y-4">
      <ProfileFilters
        value={draft}
        onChange={setDraft}
        activeCount={countActiveFilters(applied)}
        onApply={() => setApplied(toSearchParams(draft))}
        onReset={reset}
      />

      <ProfileList fetchPage={fetchPage} emptyMessage="No profiles match your search." />
    </div>
  );
}
