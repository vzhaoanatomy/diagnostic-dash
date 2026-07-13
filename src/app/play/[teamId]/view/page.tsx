import { TeamGameView } from "@/components/student/team-game-view";
import { loadTeamPlayData } from "@/lib/load-team-play-data";

export default async function TeamViewerPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const initialData = await loadTeamPlayData(teamId);

  return <TeamGameView teamId={teamId} initialData={initialData} mode="viewer" />;
}
