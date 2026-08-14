import { fetchAPI, type APIResponse, type Args, type Method } from "./fetchAPI";

export interface APIOptions {
  headers?: Record<string, string>;
  abort?: AbortController;
}

/**
 classe de base des sous-API permet l heritage de la fonction fetch
 */
export abstract class IAPI {
  protected fetch<T>(
    method: Method,
    endpoint: string,
    args: Args = {},
  ): Promise<APIResponse<T>> {
    return fetchAPI<T>(method, endpoint, args);
  }
}
