export const FAME_LIKE_WEIGHT = 4;
export const FAME_VISIT_WEIGHT = 1;
export const FAME_REPORT_WEIGHT = 1; 
export function computeFame(
  likesReceived: number,
  visitsReceived: number,
  reportsReceived = 0,
): number {
  return (
    FAME_LIKE_WEIGHT * likesReceived +
    FAME_VISIT_WEIGHT * visitsReceived -
    FAME_REPORT_WEIGHT * reportsReceived
  );
}
