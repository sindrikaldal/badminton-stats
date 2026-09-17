import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { EmptyState, SectionTitle, Shell } from "@/components/Shell";
import {
  type LeaderboardSort,
  MIN_PAIR_MATCHES,
  formatPercent,
  rankedLeaderboard,
  seasonStats,
  winRateTone,
} from "@/lib/domain/stats";
import type { Player } from "@/lib/domain/types";
import * as repo from "@/lib/repo";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "stada", label: "Stöðutafla" },
  { key: "por", label: "Bestu pörin" },
  { key: "met", label: "Met & stuð" },
] as const;

const SORTS: { key: string; sort: LeaderboardSort; label: string }[] = [
  { key: "hlutfall", sort: "winRate", label: "Sigurhlutfall" },
  { key: "sigrar", sort: "wins", label: "Sigrar" },
];

/**
 * Every link on the page carries the whole view -- tab, season and sort -- so
 * switching one never resets another. Defaults are left out to keep the URLs
 * short.
 */
function hrefFor(view: { flipi: string; timabil?: string; rada?: string }) {
  const params = new URLSearchParams();
  if (view.flipi !== "stada") params.set("flipi", view.flipi);
  if (view.timabil) params.set("timabil", view.timabil);
  if (view.rada && view.rada !== SORTS[0].key) params.set("rada", view.rada);
  const query = params.toString();
  return `/tolfraedi${query ? `?${query}` : ""}`;
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ flipi?: string; timabil?: string; rada?: string }>;
}) {
  const { flipi, timabil, rada } = await searchParams;
  const tab = TABS.find((t) => t.key === flipi)?.key ?? "stada";
  const sort = SORTS.find((s) => s.key === rada) ?? SORTS[0];
  const view = { flipi: tab, timabil, rada: sort.key };

  const [seasons, players] = await Promise.all([
    repo.getSeasons(),
    repo.getPlayers(),
  ]);

  const allTime = timabil === "allt";
  const season =
    (timabil && !allTime ? seasons.find((s) => s.id === Number(timabil)) : null) ??
    seasons.find((s) => s.endedOn === null) ??
    seasons[0];

  if (!season) {
    return (
      <Shell>
        <SectionTitle>Tölfræði</SectionTitle>
        <EmptyState title="Ekkert tímabil ennþá" />
      </Shell>
    );
  }

  const sessionLists = allTime
    ? await Promise.all(seasons.map((s) => repo.getSessions(s.id)))
    : [await repo.getSessions(season.id)];
  const sessions = sessionLists.flat();

  const stats = seasonStats(
    sessions,
    players.map((p) => p.id),
    // Guests count towards everyone's record but are never named by an award.
    new Set(players.filter((p) => !p.isGuest).map((p) => p.id)),
  );
  const byId = new Map(players.map((p) => [p.id, p]));

  return (
    <Shell status={allTime ? "Frá upphafi" : season.name}>
      <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3">
        <div>
          <p className="display text-lg text-ink">
            {stats.totalSessions} kvöld
          </p>
          <p className="text-xs text-ink-faint">
            {stats.totalMatches} leikir skráðir
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          {seasons.map((option) => (
            <SeasonChip
              key={option.id}
              href={hrefFor({ ...view, timabil: String(option.id) })}
              active={!allTime && option.id === season.id}
            >
              {option.name}
            </SeasonChip>
          ))}
          {seasons.length > 1 ? (
            <SeasonChip
              href={hrefFor({ ...view, timabil: "allt" })}
              active={allTime}
            >
              Frá upphafi
            </SeasonChip>
          ) : null}
        </div>
      </div>

      <nav className="mt-4 flex gap-2">
        {TABS.map((option) => (
          <Link
            key={option.key}
            href={hrefFor({ ...view, flipi: option.key })}
            className={`display flex-1 rounded-lg py-2.5 text-center text-sm tracking-[0.04em] ${
              option.key === tab
                ? "bg-challenge text-canvas"
                : "border border-line bg-surface-raised text-ink-muted"
            }`}
          >
            {option.label}
          </Link>
        ))}
      </nav>

      {stats.totalMatches === 0 ? (
        <div className="mt-4">
          <EmptyState title="Enginn leikur skráður ennþá" />
        </div>
      ) : tab === "stada" ? (
        <Leaderboard stats={stats} byId={byId} sort={sort} view={view} />
      ) : tab === "por" ? (
        <Pairs stats={stats} byId={byId} />
      ) : (
        <Records stats={stats} byId={byId} />
      )}
    </Shell>
  );
}

function SeasonChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`display rounded-full border px-2.5 py-1 text-[11px] tracking-[0.06em] ${
        active
          ? "border-win/60 bg-win/10 text-win"
          : "border-line bg-surface-raised text-ink-faint"
      }`}
    >
      {children}
    </Link>
  );
}

function Leaderboard({
  stats,
  byId,
  sort,
  view,
}: {
  stats: ReturnType<typeof seasonStats>;
  byId: Map<number, Player>;
  sort: (typeof SORTS)[number];
  view: { flipi: string; timabil?: string; rada?: string };
}) {
  const byWins = sort.sort === "wins";
  const rows = rankedLeaderboard(stats.players, sort.sort).filter(
    (p) => p.played > 0,
  );
  const medals = ["#f0b429", "#c0c8d4", "#c98b52"];

  return (
    <>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-ink-faint">
          {byWins
            ? "Raðað eftir sigrum."
            : `Raðað eftir sigurhlutfalli. Þarf ${stats.qualifyThreshold} leiki til að teljast með.`}
        </p>
        <div className="flex shrink-0 gap-1.5" role="group" aria-label="Röðun">
          {SORTS.map((option) => (
            <Link
              key={option.key}
              href={hrefFor({ ...view, rada: option.key })}
              aria-current={option.key === sort.key ? "true" : undefined}
              className={`display rounded-full border px-2.5 py-1 text-[11px] tracking-[0.06em] ${
                option.key === sort.key
                  ? "border-challenge/60 bg-challenge/10 text-challenge"
                  : "border-line bg-surface-raised text-ink-faint"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {rows.map((row, index) => {
          const player = byId.get(row.playerId);
          if (!player) return null;
          // A count of wins needs no qualification bar, so everyone ranks.
          const rank = byWins || row.qualified ? index + 1 : null;

          return (
            <li key={row.playerId}>
              <Link
                href={`/leikmenn/${row.playerId}`}
                className={`card relative flex items-center gap-3 p-3 ${
                  rank === 1 ? "glow-win" : ""
                }`}
              >
                {rank && rank <= 3 ? (
                  <span
                    className="absolute inset-y-0 left-0 w-[3px] rounded-l"
                    style={{ background: medals[rank - 1] }}
                    aria-hidden
                  />
                ) : null}

                <span className="display w-5 shrink-0 text-center text-sm text-ink-faint">
                  {rank ?? "–"}
                </span>
                <Avatar player={player} />

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2">
                    <span className="display truncate text-base text-ink">
                      {player.shortName}
                    </span>
                    {row.honors > 0 ? (
                      <span className="display shrink-0 text-xs text-flame">
                        {row.honors}× 3
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-[11px] text-ink-faint">
                    {row.wins}S–{row.losses}T · hrina {row.bestStreak} ·{" "}
                    {formatPercent(row.attendanceRate)} mæting
                    {/* Guests keep their wins but stay off the season board. */}
                    {row.nightsWon > 0 && !player.isGuest
                      ? ` · ${row.nightsWon} kvöld ${
                          row.nightsWon === 1 ? "unnið" : "unnin"
                        }`
                      : ""}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  {byWins ? (
                    <>
                      <p className="display tnum text-2xl text-win">
                        {row.wins}
                      </p>
                      <p className="text-[10px] text-ink-faint">
                        {formatPercent(row.winRate)} · {row.played} leikir
                      </p>
                    </>
                  ) : (
                    <>
                      <p
                        className={`display tnum text-2xl ${
                          row.qualified
                            ? winRateTone(row.winRate, row.played)
                            : "text-ink-faint"
                        }`}
                      >
                        {formatPercent(row.winRate)}
                      </p>
                      <p className="text-[10px] text-ink-faint">
                        {row.played} leikir
                      </p>
                    </>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Pairs({
  stats,
  byId,
}: {
  stats: ReturnType<typeof seasonStats>;
  byId: Map<number, Player>;
}) {
  if (stats.pairs.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState title="Ekki nóg spilað saman ennþá">
          Par þarf {MIN_PAIR_MATCHES} leiki saman til að komast á listann.
        </EmptyState>
      </div>
    );
  }

  return (
    <ul className="mt-4 space-y-2">
      {stats.pairs.map((pair) => {
        const [one, two] = pair.players.map((id) => byId.get(id));
        if (!one || !two) return null;
        return (
          <li key={pair.pair} className="card flex items-center gap-3 p-3">
            <span className="flex -space-x-2">
              <Avatar player={one} size="sm" />
              <Avatar player={two} size="sm" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="display truncate text-base text-ink">
                {one.shortName} & {two.shortName}
              </p>
              <p className="text-[11px] text-ink-faint">
                {pair.wins}S – {pair.played - pair.wins}T í {pair.played} leikjum
                {pair.honors > 0 ? ` · ${pair.honors}× 3 í röð` : ""}
              </p>
            </div>
            <p
              className={`display tnum shrink-0 text-2xl ${winRateTone(pair.winRate, pair.played)}`}
            >
              {formatPercent(pair.winRate)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/** "Kári & Arnar", but "Kári, Arnar & Birkir" once a record is shared around. */
function joinNames(names: (string | undefined)[]): string {
  const shown = names.map((n) => n ?? "?");
  if (shown.length <= 1) return shown[0] ?? "";
  return `${shown.slice(0, -1).join(", ")} & ${shown[shown.length - 1]}`;
}

function Records({
  stats,
  byId,
}: {
  stats: ReturnType<typeof seasonStats>;
  byId: Map<number, Player>;
}) {
  return (
    <ul className="mt-4 space-y-2">
      {stats.records.map((record) => (
        <li key={record.kind} className="card p-4">
          <p className="eyebrow">{record.label}</p>
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <p
              className={`display tnum text-3xl ${
                record.kind === "most-seven-nil" ? "text-flame" : "text-win"
              }`}
            >
              {record.value}
            </p>
            <p className="text-right text-xs text-ink-faint">{record.detail}</p>
          </div>
          {record.players.length > 0 ? (
            <p className="mt-2 text-sm text-ink-muted">
              <span className="display text-ink">
                {joinNames(record.players.map((id) => byId.get(id)?.shortName))}
              </span>
              {record.beaten?.length ? (
                <>
                  {" gegn "}
                  {joinNames(record.beaten.map((id) => byId.get(id)?.shortName))}
                </>
              ) : null}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
