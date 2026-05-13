export function sanitizePlainText(input: string): string {
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

export function sanitizeOptionalPlainText(input: string | null | undefined): string | null | undefined {
  if (input === undefined || input === null) return input;
  return sanitizePlainText(input);
}

