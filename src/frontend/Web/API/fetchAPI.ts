/**
 * Wrapper fetch BAS NIVEAU — le seul endroit du front qui touche réellement au réseau.
 *
 * Il renvoie TOUJOURS un `APIResponse`, jamais d'exception : le code appelant teste
 * `if (r.error)` et n'a jamais besoin de try/catch.
 */

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface Args {
  /** Devient une query string : { age: 25 } → "?age=25" */
  query?: object;
  body?: object;
  headers?: object;
  /** Permet d'annuler la requête (ex : au démontage d'un composant). */
  abort?: AbortController;
  /** Interne : évite une boucle infinie de refresh de token. */
  retrying?: boolean;
}

export interface APIGenericResponse<T> {
  status: number;
  statusText: string;
  data: T;
  error: boolean;
}

export interface APISuccess<T> extends APIGenericResponse<T> {
  error: false;
}

/** En cas d'erreur, `data` porte le message du back (ou les erreurs de validation). */
export interface APIError extends APIGenericResponse<string | Record<string, Array<string>>> {
  error: true;
}

/**
 * Union discriminée sur `error`. Après `if (r.error) return;`, TypeScript SAIT que
 * `r.data` est du type T. Impossible d'oublier de traiter le cas d'échec.
 */
export type APIResponse<T> = APISuccess<T> | APIError;

function formatQuery(query?: object): string {
  if (!query) return "";

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue; // on n'envoie pas les filtres non renseignés
    params.append(key, String(value));
  }

  const str = params.toString();
  return str ? `?${str}` : "";
}

async function getBody(res: Response): Promise<unknown> {
  const isJson = res.headers.get("content-type")?.includes("application/json");
  return isJson ? await res.json().catch(() => null) : await res.text();
}

export async function fetchAPI<T>(
  method: Method,
  endpoint: string,
  args: Args = {},
): Promise<APIResponse<T>> {
  const headers: Record<string, string> = {};
  if (args.body) headers["Content-Type"] = "application/json";
  Object.assign(headers, args.headers ?? {});

  try {
    const res = await fetch(endpoint + formatQuery(args.query), {
      method,
      headers,
      body: args.body ? JSON.stringify(args.body) : undefined,
      credentials: "include", // envoie les cookies httpOnly (session)
      signal: args.abort?.signal,
    });

    const body = await getBody(res);

    // TODO(auth) : sur 401, tenter API.auth.refresh() puis rejouer la requête
    // (une seule fois, d'où le flag `retrying`).

    if (!res.ok) {
      const message =
        typeof body === "object" && body !== null && "error" in body
          ? (body as { error: string }).error
          : res.statusText;

      return { status: res.status, statusText: res.statusText, data: message, error: true };
    }

    return {
      status: res.status,
      statusText: res.statusText,
      data: body as T,
      error: false,
    };
  } catch {
    // Le serveur est injoignable (réseau coupé, backend down) : fetch lève.
    // On le convertit en APIError pour garder un type de retour unique.
    return { status: 0, statusText: "Network Error", data: "Serveur injoignable", error: true };
  }
}
