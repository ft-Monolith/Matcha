export type SortField = "suggestion" | "age" | "fame" | "distance" | "tags";
export type SortOrder = "asc" | "desc";

export interface SearchParams {
  ageMin?: number;
  ageMax?: number;
  fameMin?: number;
  fameMax?: number;
  maxDistance?: number;
  tags?: string[];
  sort?: SortField;
  order?: SortOrder;
  limit?: number;
  offset?: number;
}
