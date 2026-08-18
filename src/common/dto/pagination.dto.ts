export interface Paginated<T> {
  items: T[];
  totalCount: number;
  hasNextPage: boolean;
}
