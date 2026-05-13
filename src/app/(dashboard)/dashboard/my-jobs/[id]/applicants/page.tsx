import { redirect } from "next/navigation";

export default async function LegacyJobApplicantsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/applicants?jobId=${id}`);
}
