import type { ReactSetState } from '../type/react.type';

export async function loadingWrapper<T>(
  setLoading: ReactSetState<boolean>,
  fn: () => Promise<T>,
): Promise<T> {
  setLoading(true);

  return fn().finally(() => setLoading(false));
}
