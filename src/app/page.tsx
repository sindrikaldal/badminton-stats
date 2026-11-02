import Link from "next/link";
import { Fragment } from "react";
import { EndSession, ReopenSession } from "@/components/EndSession";
import { LiveRefresh } from "@/components/LiveRefresh";
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
  personalStreaksInSession,
} from "@/lib/domain/streaks";
import {
  gamesOfKind,
  isSevenNil,
  isSingles,
  winnersOf,
} from "@/lib/domain/types";
import * as repo from "@/lib/repo";
import { Arrow } from "@/components/Arrow";

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
        {/* So a night started on another phone shows up here. */}
        <LiveRefresh />
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
            className="display mt-4 flex items-center justify-center rounded-lg bg-shuttle text-xl tracking-[0.04em] text-ink"
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
  // 2v2 and 1v1 each get their own table. Before the first game, the night
  // shows whichever the headcount allows.
  const played = [false, true].filter((singles) =>
    session.matches.some((m) => isSingles(m) === singles),
  );
  const kinds = played.length > 0 ? played : [session.attendees.length < 4];
  const tables = kinds.map((singles) => {
    const stats = nightStats(gamesOfKind(session, singles));
    // Beside a 2v2 table, a row for everyone who sat 1v1 out is noise.
    const lines =
      singles && played.length > 1
        ? stats.lines.filter((l) => l.played > 0)
        : stats.lines;
    return { singles, stats: { ...stats, lines } };
  });
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
  const holding = lastMatch ? winnersOf(lastMatch) : null;
  const mustSplit = pairThatMustSplit(session.matches);
  // A pair's run is the pair streak; a lone 1v1 winner's is their own 1v1 run.
  const holdingRun =
    lastMatch && holding && isSingles(lastMatch)
      ? (personalStreaksInSession(gamesOfKind(session, true).matches).current.get(
          holding[0],
        ) ?? 0)
      : (current?.length ?? 0);

  return (
    <Shell
      status={`${season.name} · ${formatIcelandicWeekday(session.playedOn)} ${formatIcelandicDate(session.playedOn)}`}
    >
      <LiveRefresh />
      <MeProvider>
        <WhoAmI players={players} />

        {!isOpen ? (
          <Link href="/" className="eyebrow inline-flex min-h-11 items-center gap-1.5">
            <Arrow direction="left" />
            Öll kvöld
          </Link>
        ) : null}

        {isOpen ? (
          <>
            <SessionBoard
              sessionId={session.id}
              attendees={attendees}
              matches={session.matches}
              holding={holding}
              mustSplit={mustSplit}
              holdingRun={holdingRun}
              honorsTonight={honors.length}
              celebrate={freshHonor}
              shame={freshShame}
              justLogged={justPlayed}
            />

            {tables.map(({ singles, stats }) => (
              <Fragment key={String(singles)}>
                <SectionTitle>
                  {singles ? "Staðan í kvöld · 1 á 1" : "Staðan í kvöld"}
                </SectionTitle>
                <NightStandings
                  listId={`kvold-${session.id}-${singles ? "1a1" : "2a2"}`}
                  lines={stats.lines}
                  players={players}
                  leaders={stats.playerOfTheNight}
                  qualifyThreshold={stats.qualifyThreshold}
                />
              </Fragment>
            ))}

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
            {tables.map(({ singles, stats }) => (
              <Fragment key={String(singles)}>
                <SectionTitle>
                  {singles ? "Kvöldið í tölum · 1 á 1" : "Kvöldið í tölum"}
                </SectionTitle>
                <NightSummary stats={stats} players={players} />
              </Fragment>
            ))}
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
            fresh={justPlayed}
          />
        )}
      </MeProvider>
    </Shell>
  );
}
