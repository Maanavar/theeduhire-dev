import type { ApiResponse } from "@/types";

export type ApiFieldErrors = Record<string, string[] | undefined>;

type ApiEnvelope<TData, TError> =
  | ({ success: true; data: TData } & Record<string, unknown>)
  | ({ success: false; error?: TError } & Record<string, unknown>);

type ApiSuccessEnvelope<TData, TExtra extends object = Record<string, never>> = {
  success: true;
  data: TData;
} & TExtra;

export class ApiRequestError<TError = unknown> extends Error {
  status: number;
  error: TError | undefined;

  constructor(message: string, status: number, error?: TError) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.error = error;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pickFirstFieldError(error: unknown): string | undefined {
  if (!isObject(error)) return undefined;

  for (const value of Object.values(error)) {
    if (Array.isArray(value)) {
      const first = value.find((item) => typeof item === "string");
      if (typeof first === "string") return first;
    }
  }

  return undefined;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  const fieldError = pickFirstFieldError(error);
  if (fieldError) {
    return fieldError;
  }

  return fallback;
}

async function parseApiEnvelope<TData, TError>(
  response: Response
): Promise<ApiEnvelope<TData, TError> | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as ApiEnvelope<TData, TError>;
  } catch {
    return null;
  }
}

export async function apiRequest<TData, TError = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackMessage = "Request failed"
): Promise<TData> {
  const response = await fetch(input, init);
  const payload = await parseApiEnvelope<TData, TError>(response);

  if (!response.ok || !payload?.success) {
    throw new ApiRequestError<TError>(
      getErrorMessage(payload?.error, fallbackMessage),
      response.status,
      payload?.error as TError | undefined
    );
  }

  return payload.data;
}

export async function apiRequestWithMeta<
  TData,
  TError = unknown,
  TExtra extends object = Record<string, never>
>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackMessage = "Request failed"
): Promise<ApiSuccessEnvelope<TData, TExtra>> {
  const response = await fetch(input, init);
  const payload = await parseApiEnvelope<TData, TError>(response);

  if (!response.ok || !payload?.success) {
    throw new ApiRequestError<TError>(
      getErrorMessage(payload?.error, fallbackMessage),
      response.status,
      payload?.error as TError | undefined
    );
  }

  return payload as ApiSuccessEnvelope<TData, TExtra>;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong"
): string {
  if (error instanceof ApiRequestError) {
    return error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function getApiFieldError(
  error: unknown,
  field: string
): string | undefined {
  if (!(error instanceof ApiRequestError) || !isObject(error.error)) {
    return undefined;
  }

  const value = error.error[field];
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.find((item) => typeof item === "string");
}

export type TypedApiResponse<T> = ApiResponse<T>;
