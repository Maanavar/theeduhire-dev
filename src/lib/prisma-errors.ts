import { Prisma } from "@prisma/client";

export function isPrismaMissingColumnError(error: unknown, columnName?: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== "P2022") {
    return false;
  }

  if (!columnName) {
    return true;
  }

  const missingColumn = String(error.meta?.column ?? "");
  return missingColumn.includes(columnName);
}
