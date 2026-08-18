export const FAME_LIKE_WEIGHT = 4;
export const FAME_VISIT_WEIGHT = 1;

export function computeFame(likesReceived: number, visitsReceived: number): number {
  return FAME_LIKE_WEIGHT * likesReceived + FAME_VISIT_WEIGHT * visitsReceived;
}
