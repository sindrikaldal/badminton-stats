import Link from "next/link";
import { MatchList } from "@/components/MatchList";
import { EmptyState, SectionTitle, Shell } from "@/components/Shell";
import { formatIcelandicDate, formatIcelandicWeekday } from "@/lib/domain/stats";
import { pairStreaksInSession } from "@/lib/domain/streaks";
import * as repo from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ timabil?: string }>;
}) {
  const { timabil } = await searchParams;
  const [seasons, players] = await Promise.all([
    repo.getSeasons(),
    repo.getPlayers(),
  ]);

  const season =
    (timabil ? seasons.find((s) => s.id === Number(timabil)) : null) ??
    seasons.find((s) => s.endedOn === null) ??
    seasons[0];

  if (!season) {
    return (
      <Shell>
        <SectionTitle>Leikir</SectionTitle>
        <EmptyState title="Ekkert tímabil ennþá">
          Stofnaðu tímabil á Kvöldið-flipanum.
        </EmptyState>
      </Shell>
    );
  }

  const sessions = await repo.getSessions(season.id);
  const newestFirst = [...sessions].reverse();

  return (
    <Shell status={season.name}>
      <div className="flex items-center justify-between">
        <SectionTitle>Kvöldin</SectionTitle>
        <Link
          href="/?nytt=1"
          className="display mt-6 mb-3 rounded-lg bg-win px-3 py-2 text-sm tracking-[0.06em] text-canvas"
        >
          + Nýtt kvöld
        </Link>
      </div>

      {seasons.length > 1 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {seasons.map((option) => (
            <Link
              key={option.id}
              href={`/leikir?timabil=${option.id}`}
              className={`display rounded-full border px-3 py-1.5 text-xs tracking-[0.06em] ${
                option.id === season.id
                  ? "border-win/60 bg-win/10 text-win"
                  : "border-line bg-surface-raised text-ink-muted"
              }`}
            >
              {option.name}
            </Link>
          ))}
        </div>
      ) : null}

      {newestFirst.length === 0 ? (
        <EmptyState title="Ekkert kvöld skráð">
          Byrjaðu fyrsta kvöldið á Kvöldið-flipanum.
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {newestFirst.map((session) => {
            const { honors } = pairStreaksInSession(session.matches);
            return (
              <section key={session.id}>
                <div className="mb-2 flex items-end justify-between gap-3">
                  <div>
                    <h3 className="display flex items-center gap-2 text-lg text-ink">
                      {formatIcelandicDate(session.playedOn)}
                      {session.endedAt === null ? (
                        <span className="display rounded border border-win/50 bg-win/10 px-1.5 py-0.5 text-[10px] tracking-[0.1em] text-win">
                          Í gangi
                        </span>
                      ) : null}
                    </h3>
                    <p className="text-xs text-ink-faint">
                      {formatIcelandicWeekday(session.playedOn)} ·{" "}
                      {session.matches.length} leikir · {session.attendees.length}{" "}
                      mættir
                      {honors.length > 0
                        ? ` · ${honors.length}× þrír í röð`
                        : ""}
                    </p>
                  </div>
                  <Link
                    href={`/?kvold=${session.id}`}
                    className="display shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs tracking-[0.06em] text-ink-muted"
                  >
                    Opna
                  </Link>
                </div>

                {session.matches.length === 0 ? (
                  <EmptyState title="Enginn leikur skráður" />
                ) : (
                  <MatchList
                    matches={[...session.matches].reverse()}
                    players={players}
                    honors={honors}
                  />
                )}
              </section>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
