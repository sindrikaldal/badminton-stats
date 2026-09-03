import { MeProvider, WhoAmI } from "@/components/Me";
import { EmptyState, SectionTitle, Shell } from "@/components/Shell";
import { MatchList } from "@/components/MatchList";
import { SessionAdmin } from "@/components/SessionAdmin";
import { SessionBoard } from "@/components/SessionBoard";
import { StartSeason } from "@/components/StartSeason";
import { StartSession } from "@/components/StartSession";
import { formatIcelandicDate, formatIcelandicWeekday } from "@/lib/domain/stats";
import {
  honorFromMatch,
  pairStreaksInSession,
  pairThatMustSplit,
} from "@/lib/domain/streaks";
import { winnersOf } from "@/lib/domain/types";
import * as repo from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function TonightPage({
  searchParams,
}: {
  searchParams: Promise<{ kvold?: string; nyr?: string; nytt?: string }>;
}) {
  const params = await searchParams;
  const [season, players] = await Promise.all([
    repo.getActiveSeason(),
    repo.getPlayers(),
  ]);

  if (!season) {
    return (
      <Shell>
        <SectionTitle>Ekkert tímabil í gangi</SectionTitle>
        <StartSeason />
      </Shell>
    );
  }

  const requested = params.kvold ? Number(params.kvold) : null;
  const session = requested
    ? await repo.getSession(requested)
    : await repo.getLatestSession(season.id);

  const roster = players.filter((p) => p.isActive);

  if (!session || params.nytt === "1") {
    return (
      <Shell status={season.name}>
        <MeProvider>
          <WhoAmI players={players} />
        </MeProvider>
        <SectionTitle>Nýtt badmintonkvöld</SectionTitle>
        <StartSession players={roster} />
      </Shell>
    );
  }

  const { current, honors } = pairStreaksInSession(session.matches);
  const justPlayed = params.nyr ? Number(params.nyr) : null;
  const freshHonor = justPlayed
    ? honorFromMatch(session.matches, justPlayed)
    : null;

  const byId = new Map(players.map((p) => [p.id, p]));
  const attendees = session.attendees
    .map((id) => byId.get(id))
    .filter((p) => p !== undefined);

  // Whoever holds the court is offered first on the next-match form -- unless
  // they have just earned an honor, in which case they owe the rule a split.
  const lastMatch = session.matches.at(-1);
  const holdingPair = lastMatch ? winnersOf(lastMatch) : null;
  const mustSplit = pairThatMustSplit(session.matches);

  return (
    <Shell
      status={`${season.name} · ${formatIcelandicWeekday(session.playedOn)} ${formatIcelandicDate(session.playedOn)}`}
    >
      <MeProvider>
        <WhoAmI players={players} />

        <SessionBoard
          sessionId={session.id}
          attendees={attendees}
          matches={session.matches}
          holdingPair={holdingPair}
          mustSplit={mustSplit}
          currentStreak={current}
          honorsTonight={honors.length}
          celebrate={freshHonor}
        />

        <SessionAdmin
          sessionId={session.id}
          roster={roster}
          attendees={session.attendees}
          matchCount={session.matches.length}
        />

        <SectionTitle>Leikir kvöldsins</SectionTitle>
        {session.matches.length === 0 ? (
          <EmptyState title="Enginn leikur skráður ennþá">
            Skráðu fyrsta leikinn hér að ofan.
          </EmptyState>
        ) : (
          <MatchList
            matches={[...session.matches].reverse()}
            players={players}
            honors={honors}
          />
        )}
      </MeProvider>
    </Shell>
  );
}
