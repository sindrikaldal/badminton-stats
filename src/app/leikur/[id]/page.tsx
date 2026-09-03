import Link from "next/link";
import { notFound } from "next/navigation";
import { EditMatch } from "@/components/EditMatch";
import { SectionTitle, Shell } from "@/components/Shell";
import { formatIcelandicDate } from "@/lib/domain/stats";
import * as repo from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await repo.getMatch(Number(id));
  if (!match) notFound();

  const [session, players] = await Promise.all([
    repo.getSession(match.sessionId),
    repo.getPlayers(),
  ]);
  if (!session) notFound();

  // Anyone who was there that night can be moved into the match, plus whoever
  // is already in it -- a retrospective fix may involve someone unticked.
  const candidateIds = new Set([
    ...session.attendees,
    ...match.teamA,
    ...match.teamB,
  ]);
  const candidates = players.filter((p) => candidateIds.has(p.id));

  return (
    <Shell status={formatIcelandicDate(session.playedOn)}>
      <Link href={`/?kvold=${session.id}`} className="eyebrow">
        ← Til baka
      </Link>
      <SectionTitle>Leikur {match.seq}</SectionTitle>
      <EditMatch match={match} candidates={candidates} sessionId={session.id} />
    </Shell>
  );
}
