import { fetchAPI, type APIResponse, type Args, type Method } from "./fetchAPI";

export interface APIOptions {
  headers?: Record<string, string>;
  abort?: AbortController;
}

/**
 * Classe de BASE de toutes les sous-API (api.health, api.auth, api.profile…).
 *
 * Elle n'expose qu'UNE méthode : `fetch(method, endpoint, args)`.
 *
 * Son intérêt n'est pas de « factoriser un fetch » — c'est d'être la COUTURE où l'on
 * pourra injecter des choses transverses à TOUTES les requêtes, à un seul endroit.
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
