const DESTRUCTIVE_CONFIRMATION = "I_UNDERSTAND_THIS_DESTROYS_DATA";
const SMOKE_DATA_CONFIRMATION = "I_UNDERSTAND_THIS_WRITES_TEST_DATA";
const DISALLOWED_PASSWORDS = new Set([
  "password",
  "password123",
  "changeme",
  "change-this-before-seeding",
  "eduhire@123",
]);

export function assertDestructiveDbScriptAllowed(scriptName: string) {
  const label = process.env.DATABASE_SAFETY_LABEL?.trim().toLowerCase();
  const confirmation = process.env.CONFIRM_DESTRUCTIVE_DB_SCRIPT?.trim();
  const databaseUrl = process.env.DATABASE_URL?.trim() || "";

  if (process.env.NODE_ENV === "production") {
    throw new Error(`${scriptName} is blocked when NODE_ENV=production.`);
  }

  if (!label || ["prod", "production", "live"].includes(label)) {
    throw new Error(`${scriptName} requires DATABASE_SAFETY_LABEL=local, development, staging, or demo.`);
  }

  if (confirmation !== DESTRUCTIVE_CONFIRMATION) {
    throw new Error(
      `${scriptName} requires CONFIRM_DESTRUCTIVE_DB_SCRIPT=${DESTRUCTIVE_CONFIRMATION}.`
    );
  }

  if (!databaseUrl) {
    throw new Error(`${scriptName} requires DATABASE_URL so the target database is explicit.`);
  }

  const normalizedUrl = databaseUrl.toLowerCase();
  if (/\b(prod|production|live)\b/.test(normalizedUrl) || normalizedUrl.includes("theeduhire.in")) {
    throw new Error(`${scriptName} refused to run against a database URL that looks production-like.`);
  }
}

export function assertSmokeDataScriptAllowed(scriptName: string) {
  const label = process.env.DATABASE_SAFETY_LABEL?.trim().toLowerCase();
  const confirmation = process.env.ALLOW_SMOKE_DATA_SCRIPT?.trim();
  const databaseUrl = process.env.DATABASE_URL?.trim() || "";

  if (process.env.NODE_ENV === "production") {
    throw new Error(`${scriptName} is blocked when NODE_ENV=production.`);
  }

  if (!label || ["prod", "production", "live"].includes(label)) {
    throw new Error(`${scriptName} requires DATABASE_SAFETY_LABEL=local, development, staging, or demo.`);
  }

  if (confirmation !== SMOKE_DATA_CONFIRMATION) {
    throw new Error(`${scriptName} requires ALLOW_SMOKE_DATA_SCRIPT=${SMOKE_DATA_CONFIRMATION}.`);
  }

  const normalizedUrl = databaseUrl.toLowerCase();
  if (/\b(prod|production|live)\b/.test(normalizedUrl) || normalizedUrl.includes("theeduhire.in")) {
    throw new Error(`${scriptName} refused to write smoke data to a production-like database URL.`);
  }
}

export function getRequiredScriptPassword(envName: string, minLength = 12) {
  const password = process.env[envName]?.trim();
  if (!password || password.length < minLength) {
    throw new Error(`${envName} must be set and at least ${minLength} characters long.`);
  }

  if (DISALLOWED_PASSWORDS.has(password.toLowerCase())) {
    throw new Error(`${envName} must not be a default or commonly shared password.`);
  }

  return password;
}
