import Link from "next/link";
import { EndSession, ReopenSession } from "@/components/EndSession";
import { MeProvider, WhoAmI } from "@/components/Me";
import { EmptyState, SectionTitle, Shell } from "@/components/Shell";
import { MatchList } from "@/components/MatchList";
import { NightStandings } from "@/components/NightStandings";
import { NightSummary } from "@/components/NightSummary";
import { SessionAdmin } from "@/components/SessionAdmin";
import { SessionBoard } from "@/components/SessionBoard";
import { SessionHistory } from "@/components/SessionHistory";
import { StartSeason } from "@/components/StartSeason";
import { StartSession } from "@/components/StartSession";
import { nightStats } from "@/lib/domain/night";
import { formatIcelandicDate, formatIcelandicWeekday } from "@/lib/domain/stats";
import {
  honorFromMatch,
  pairStreaksInSession,
  pairThatMustSplit,
} from "@/lib/domain/streaks";
import { isSevenNil, winnersOf } from "@/lib/domain/types";
import * as repo from "@/lib/repo";

export const dynamic = "force-dynamic";

/**
 * The operational tab. Three states, in order of what you most likely want:
 *
 * 1. an evening in progress -> the score pad
 * 2. a specific evening asked for by `?kvold=` -> that night, read-only if closed
 * 3. nothing in progress -> start a night, with the history underneath
 */
export default async function TonightPage({
  searchParams,
}: {
  searchParams: Promise<{ kvold?: string; nyr?: string; nytt?: string }>;
}) {
  const params = await searchParams;
  const [season, players, seasons] = await Promise.all([
    repo.getActiveSeason(),
    repo.getPlayers(),
    repo.getSeasons(),
  ]);

  if (!season) {
    return (
      <Shell>
        <SectionTitle>Ekkert tímabil í gangi</SectionTitle>
        <StartSeason />
      </Shell>
    );
  }

  const roster = players.filter((p) => p.isActive);
  const requested = params.kvold ? Number(params.kvold) : null;
  const session = requested
    ? await repo.getSession(requested)
    : await repo.getOpenSession();

  // Starting a night: asked for explicitly, or nowhere else to go.
  if (params.nytt === "1") {
    const open = await repo.getOpenSession();
    return (
      <Shell status={season.name}>
        <MeProvider>
          <WhoAmI players={players} />
        </MeProvider>
        <SectionTitle>Nýtt badmintonkvöld</SectionTitle>
        {open ? (
          <EmptyState title="Það er kvöld í gangi">
            <Link href={`/?kvold=${open.id}`} className="text-win underline">
              Opna {formatIcelandicDate(open.playedOn)}
            </Link>{" "}
            og ljúka því fyrst.
          </EmptyState>
        ) : (
          <StartSession players={roster} />
        )}
      </Shell>
    );
  }

  if (!session) {
    const history = await repo.getSessionSummaries();
    return (
      <Shell status={season.name}>
        <MeProvider>
          <WhoAmI players={players} />
        </MeProvider>

        <div className="card mt-2 p-5 text-center">
          <p className="display text-xl text-ink">Ekkert kvöld í gangi</p>
          <p className="mt-1 text-sm text-ink-faint">
            {history.length === 0
              ? "Byrjaðu fyrsta kvöldið á tímabilinu."
              : "Byrjaðu nýtt kvöld eða opnaðu eitt af þeim fyrri."}
          </p>
          <Link
            href="/?nytt=1"
            className="display mt-4 flex items-center justify-center rounded-lg bg-win text-base tracking-[0.06em] text-canvas"
            style={{ height: "3.5rem" }}
          >
            Byrja nýtt kvöld
          </Link>
        </div>

        {history.length > 0 ? (
          <>
            <SectionTitle>Fyrri kvöld</SectionTitle>
            <SessionHistory sessions={history} showSeason={seasons.length > 1} />
          </>
        ) : null}
      </Shell>
    );
  }

  const isOpen = session.endedAt === null;
  const tonight = nightStats(session);
  const { current, honors } = pairStreaksInSession(session.matches);
  const justPlayed = params.nyr ? Number(params.nyr) : null;
  const freshHonor = justPlayed
    ? honorFromMatch(session.matches, justPlayed)
    : null;
  const freshMatch = justPlayed
    ? session.matches.find((m) => m.id === justPlayed) ?? null
    : null;
  const freshShame = freshMatch && isSevenNil(freshMatch) ? freshMatch : null;

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

        {!isOpen ? (
          <Link href="/" className="eyebrow">
            ← Öll kvöld
          </Link>
        ) : null}

        {isOpen ? (
          <>
            <SessionBoard
              sessionId={session.id}
              attendees={attendees}
              matches={session.matches}
              holdingPair={holdingPair}
              mustSplit={mustSplit}
              currentStreak={current}
              honorsTonight={honors.length}
              celebrate={freshHonor}
              shame={freshShame}
            />

            <SectionTitle>Staðan í kvöld</SectionTitle>
            <NightStandings
              lines={tonight.lines}
              players={players}
              leaders={tonight.playerOfTheNight}
              qualifyThreshold={tonight.qualifyThreshold}
            />

            <SessionAdmin
              sessionId={session.id}
              roster={roster}
              attendees={session.attendees}
              matchCount={session.matches.length}
            />

            <EndSession
              sessionId={session.id}
              matchCount={session.matches.length}
            />
          </>
        ) : (
          <>
            <SectionTitle>Kvöldið í tölum</SectionTitle>
            <NightSummary stats={tonight} players={players} />
            <ReopenSession sessionId={session.id} />
          </>
        )}

        <SectionTitle>
          {isOpen ? "Leikir kvöldsins" : "Leikir þessa kvölds"}
        </SectionTitle>
        {session.matches.length === 0 ? (
          <EmptyState title="Enginn leikur skráður">
            {isOpen ? "Skráðu fyrsta leikinn hér að ofan." : null}
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
