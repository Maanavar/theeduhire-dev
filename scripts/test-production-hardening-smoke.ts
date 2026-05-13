import { disconnectProductionHardeningPrisma, runProductionHardeningSmoke } from "./lib/production-hardening-smoke";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function run() {
  const results = await runProductionHardeningSmoke(BASE_URL);
  const failed = results.filter((result) => !result.passed);

  for (const result of results) {
    console.log(`${result.passed ? "PASS" : "FAIL"}: ${result.name} - ${result.details}`);
  }

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

run()
  .catch((error) => {
    console.error("Production hardening smoke run failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectProductionHardeningPrisma();
  });
