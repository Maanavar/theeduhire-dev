import { disconnectSmokePrisma, ensureSmokeData } from "./lib/smoke-data";

async function main() {
  const smoke = await ensureSmokeData();

  console.log("SMOKE_SCHOOL_EMAIL=" + smoke.school.email);
  console.log("SMOKE_TEACHER_EMAIL=" + smoke.teacher.email);
  console.log("SMOKE_ADMIN_EMAIL=" + smoke.admin.email);
  console.log("SMOKE_PASSWORD=" + smoke.teacher.password);
  console.log("SMOKE_JOB_ID=" + smoke.school.jobId);
  console.log("SMOKE_APPLICATION_ID=" + smoke.school.applicationId);
  console.log("SMOKE_RESUME_ID=" + smoke.teacher.resumeId);
  console.log("SMOKE_TEACHER_PROFILE_ID=" + smoke.teacher.profileId);
  console.log("SMOKE_PENDING_SCHOOL_ID=" + smoke.pendingSchool.schoolId);
}

main()
  .catch((error) => {
    console.error("Smoke data seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectSmokePrisma();
  });
