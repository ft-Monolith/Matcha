export type SortField = "suggestion" | "age" | "fame" | "distance" | "tags";
export type SortOrder = "asc" | "desc";

export const SEARCH_AGE_MIN = 18;
export const SEARCH_AGE_MAX = 100;
export const SEARCH_FAME_MIN = -10000;
export const SEARCH_FAME_MAX = 100000;
export const SEARCH_DISTANCE_MIN = 1;
export const SEARCH_DISTANCE_MAX = 20000;

export function clampRange(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

export interface SearchParams {
  ageMin?: number;
  ageMax?: number;
  fameMin?: number;
  fameMax?: number;
  maxDistance?: number;
  tags?: string[];
  sort?: SortField;
  order?: SortOrder;
  hideFlagged?: boolean;
  limit?: number;
  offset?: number;
}
