type CookieMap = Map<string, string>;

export type AuthSessionUser = {
  id: string;
  role: string;
  email?: string | null;
  sessionToken?: string;
};

export function createCookieStore(): CookieMap {
  return new Map<string, string>();
}

export function updateCookies(store: CookieMap, response: Response) {
  const setCookie = response.headers.getSetCookie?.() || [];
  for (const cookie of setCookie) {
    const [pair] = cookie.split(";", 1);
    const eqIndex = pair.indexOf("=");
    if (eqIndex === -1) continue;
    const name = pair.slice(0, eqIndex).trim();
    const value = pair.slice(eqIndex + 1).trim();
    if (name) store.set(name, value);
  }
}

export function cookieHeader(store: CookieMap) {
  return Array.from(store.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

export async function requestJson<T>(
  url: string,
  init: RequestInit,
  cookies: CookieMap
): Promise<{ response: Response; data: T }> {
  const response = await fetch(url, {
    redirect: "manual",
    ...init,
    headers: {
      ...(init.headers || {}),
      cookie: cookieHeader(cookies),
    },
  });
  updateCookies(cookies, response);
  const data = (await response.json()) as T;
  return { response, data };
}

export async function requestText(
  url: string,
  init: RequestInit,
  cookies: CookieMap
): Promise<Response> {
  const response = await fetch(url, {
    redirect: "manual",
    ...init,
    headers: {
      ...(init.headers || {}),
      cookie: cookieHeader(cookies),
    },
  });
  updateCookies(cookies, response);
  await response.text();
  return response;
}

export async function signInWithCredentials(input: {
  baseUrl: string;
  email: string;
  password: string;
  callbackPath: string;
}) {
  const cookies = createCookieStore();
  const csrfRes = await fetch(`${input.baseUrl}/api/auth/csrf`, {
    redirect: "manual",
  });
  updateCookies(cookies, csrfRes);
  const csrfJson = (await csrfRes.json()) as { csrfToken?: string };

  if (!csrfJson.csrfToken) {
    throw new Error("Unable to fetch CSRF token");
  }

  const body = new URLSearchParams({
    csrfToken: csrfJson.csrfToken,
    email: input.email,
    password: input.password,
    callbackUrl: `${input.baseUrl}${input.callbackPath}`,
    json: "true",
  });

  const authRes = await fetch(`${input.baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      cookie: cookieHeader(cookies),
      "X-Auth-Return-Redirect": "1",
    },
    body,
  });
  updateCookies(cookies, authRes);
  const authJson = (await authRes.json()) as { url?: string };

  const session = await requestJson<{ user?: AuthSessionUser }>(
    `${input.baseUrl}/api/auth/session`,
    {},
    cookies
  );

  return {
    cookies,
    response: authRes,
    redirectUrl: authJson.url || "",
    session: session.data,
  };
}
