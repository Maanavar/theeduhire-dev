import { processBackgroundJobs } from "@/lib/background-job-processor";
import { processDomainEventConsumers } from "@/lib/domain-event-processor";

async function main() {
  const eventResults = await processDomainEventConsumers(50);
  const jobResults = await processBackgroundJobs(100);

  console.log(
    JSON.stringify(
      {
        eventConsumers: eventResults,
        backgroundJobs: jobResults,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("Platform queue processing failed:", error);
  process.exitCode = 1;
});
