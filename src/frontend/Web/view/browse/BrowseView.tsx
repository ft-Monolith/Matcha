import { useCallback, useState } from "react";
import type { SearchParams } from "@common/dto/search.dto";
import { API } from "@web/API/api";
import { ProfileDeck } from "@web/component/ProfileDeck";
import {
  ProfileFilters,
  countActiveFilters,
  toSearchParams,
  EMPTY_FILTERS,
  type ProfileFiltersValue,
} from "@web/component/ProfileFilters";

/** Browse trie par pertinence. */
const BROWSE_FILTERS: ProfileFiltersValue = EMPTY_FILTERS;

export function BrowseView() {
  const [draft, setDraft] = useState<ProfileFiltersValue>(BROWSE_FILTERS);
  const [applied, setApplied] = useState<SearchParams>(toSearchParams(BROWSE_FILTERS));

  const fetchPage = useCallback(
    (limit: number, offset: number) => API.profiles.search({ ...applied, limit, offset }),
    [applied],
  );

  function reset() {
    setDraft(BROWSE_FILTERS);
    setApplied(toSearchParams(BROWSE_FILTERS));
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="shrink-0">
        <ProfileFilters
          value={draft}
          onChange={setDraft}
          activeCount={countActiveFilters(applied)}
          onApply={() => setApplied(toSearchParams(draft))}
          onReset={reset}
        />
      </div>

      <div className="min-h-0 flex-1">
        <ProfileDeck fetchPage={fetchPage} emptyMessage="No suggestions for you yet." />
      </div>
    </div>
  );
}
