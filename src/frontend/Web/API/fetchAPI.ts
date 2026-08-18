

import { Routes } from "@common/routes/routes";

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface Args {
  query?: object;
  body?: object;
  headers?: object;
  abort?: AbortController;
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

/** En cas d'erreur, `data` porte le message du back */
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


let refreshInFlight: Promise<boolean> | null = null;

function tryRefresh(): Promise<boolean> {
  refreshInFlight ??= fetch(Routes.Auth.Refresh, { method: "POST", credentials: "include" })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
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


    if (
      res.status === 401 &&
      !args.retrying &&
      endpoint !== Routes.Auth.Refresh &&
      endpoint !== Routes.Auth.Login
    ) {
      if (await tryRefresh()) {
        return fetchAPI<T>(method, endpoint, { ...args, retrying: true });
      }
    }

    const body = await getBody(res);

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
    return { status: 0, statusText: "Network Error", data: "Server unreachable", error: true };
  }
}
