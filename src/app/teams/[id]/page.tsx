import { notFound } from "next/navigation";
import TeamPageClient from "./TeamPageClient";

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { id } = await params;
  const teamId = Number(id);

  if (!Number.isInteger(teamId) || teamId <= 0) {
    notFound();
  }

  return <TeamPageClient teamId={teamId} />;
}
