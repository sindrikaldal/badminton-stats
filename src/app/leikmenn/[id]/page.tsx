import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, avatarColor } from "@/components/Avatar";
import { MatchList } from "@/components/MatchList";
import { EmptyState, SectionTitle, Shell } from "@/components/Shell";
import {
  chemistryFor,
  formatIcelandicDate,
  formatPercent,
  headToHead,
  rankedLeaderboard,
  recentMatchesFor,
  seasonStats,
} from "@/lib/domain/stats";
import { pairStreaksInSession } from "@/lib/domain/streaks";
import type { Player } from "@/lib/domain/types";
import * as repo from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ timabil?: string }>;
}) {
  const [{ id }, { timabil }] = await Promise.all([params, searchParams]);
  const playerId = Number(id);

  const [players, seasons] = await Promise.all([
    repo.getPlayers(),
    repo.getSeasons(),
  ]);

  const player = players.find((p) => p.id === playerId);
  if (!player) notFound();

  const allTime = timabil === "allt";
  const season =
    (timabil && !allTime ? seasons.find((s) => s.id === Number(timabil)) : null) ??
    seasons.find((s) => s.endedOn === null) ??
    seasons[0];

  const sessionLists =
    allTime || !season
      ? await Promise.all(seasons.map((s) => repo.getSessions(s.id)))
      : [await repo.getSessions(season.id)];
  const sessions = sessionLists.flat();
  const matches = sessions.flatMap((s) => s.matches);

  const stats = seasonStats(
    sessions,
    players.map((p) => p.id),
  );
  const mine = stats.players.find((s) => s.playerId === playerId);
  const ranked = rankedLeaderboard(stats.players).filter((s) => s.played > 0);
  const rank = ranked.findIndex((s) => s.playerId === playerId);

  const byId = new Map(players.map((p) => [p.id, p]));
  const chemistry = chemistryFor(matches, playerId);
  const h2h = headToHead(matches, playerId);
  const recent = recentMatchesFor(sessions, playerId, 8);
  const dates = new Map(
    sessions.map((s) => [s.id, formatIcelandicDate(s.playedOn)]),
  );
  const honors = sessions.flatMap((s) => pairStreaksInSession(s.matches).honors);

  const best = chemistry.filter((c) => c.played >= 3)[0];

  return (
    <Shell status={allTime ? "Frá upphafi" : season?.name}>
      <Link href="/leikmenn" className="eyebrow">
        ← Leikmenn
      </Link>

      <div className="card mt-3 p-4">
        <div className="flex items-center gap-4">
          <Avatar player={player} size="xl" />
          <div className="min-w-0">
            {rank >= 0 && mine?.qualified ? (
              <p
                className="display text-xs tracking-[0.1em]"
                style={{ color: avatarColor(player.id) }}
              >
                #{rank + 1} á stöðutöflunni
              </p>
            ) : null}
            <h1 className="display truncate text-3xl text-ink">{player.name}</h1>
            <p className="text-xs text-ink-faint">
              {player.isGuest ? "Gestur" : "Fastamaður"}
            </p>
          </div>
        </div>

        {mine && mine.played > 0 ? (
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
            <Stat value={String(mine.played)} label="Leikir" />
            <Stat
              value={`${mine.avgMargin > 0 ? "+" : ""}${mine.avgMargin.toFixed(1)}`}
              label="Meðalmunur"
            />
            <Stat
              value={`${mine.sessionsAttended}/${stats.totalSessions}`}
              label="Kvöld"
            />
          </div>
        ) : null}
      </div>

      {seasons.length > 1 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {seasons.map((option) => (
            <Link
              key={option.id}
              href={`/leikmenn/${playerId}?timabil=${option.id}`}
              className={`display rounded-full border px-2.5 py-1 text-[11px] ${
                !allTime && option.id === season?.id
                  ? "border-win/60 bg-win/10 text-win"
                  : "border-line bg-surface-raised text-ink-faint"
              }`}
            >
              {option.name}
            </Link>
          ))}
          <Link
            href={`/leikmenn/${playerId}?timabil=allt`}
            className={`display rounded-full border px-2.5 py-1 text-[11px] ${
              allTime
                ? "border-win/60 bg-win/10 text-win"
                : "border-line bg-surface-raised text-ink-faint"
            }`}
          >
            Frá upphafi
          </Link>
        </div>
      ) : null}

      {!mine || mine.played === 0 ? (
        <div className="mt-4">
          <EmptyState title="Engir leikir skráðir á þessu tímabili" />
        </div>
      ) : (
        <>
          <SectionTitle>Tölfræði</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <Tile
              label="Sigurhlutfall"
              value={formatPercent(mine.winRate)}
              detail={`${mine.wins} sigrar · ${mine.losses} töp`}
              tone={mine.winRate >= 0.5 ? "win" : "muted"}
            />
            <Tile
              label="Hrina núna"
              value={String(mine.currentStreak)}
              detail={`Besta: ${mine.bestStreak} í röð`}
              tone={mine.currentStreak >= 2 ? "flame" : "muted"}
            />
            <Tile
              label="Þrír í röð"
              value={String(mine.honors)}
              detail="heiðursmerki"
              tone={mine.honors > 0 ? "flame" : "muted"}
            />
            <Tile
              label="Mæting"
              value={formatPercent(mine.attendanceRate)}
              detail={`${mine.sessionsAttended} af ${stats.totalSessions} kvöldum`}
              tone="challenge"
            />
          </div>

          {best ? (
            <>
              <SectionTitle>Besti meðspilari</SectionTitle>
              <div className="card glow-win flex items-center gap-3 p-4">
                <Avatar player={byId.get(best.opponent)!} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="display truncate text-lg text-ink">
                    {byId.get(best.opponent)?.shortName}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {best.played} leikir saman · {best.wins} sigrar
                  </p>
                </div>
                <p className="display tnum text-2xl text-win">
                  {formatPercent(best.winRate)}
                </p>
              </div>
            </>
          ) : null}

          {chemistry.length > 1 ? (
            <>
              <SectionTitle>Með hverjum</SectionTitle>
              <BarList rows={chemistry} byId={byId} tone="win" />
            </>
          ) : null}

          {h2h.length > 0 ? (
            <>
              <SectionTitle>Innbyrðis árangur</SectionTitle>
              <BarList rows={h2h} byId={byId} tone="challenge" />
            </>
          ) : null}

          <SectionTitle>Nýlegir leikir</SectionTitle>
          <MatchList
            matches={recent.map((r) => r.match)}
            players={players}
            honors={honors}
            highlight={playerId}
            showDate
            dates={dates}
          />
        </>
      )}
    </Shell>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="display tnum text-xl text-ink">{value}</p>
      <p className="text-[10px] tracking-[0.1em] text-ink-faint uppercase">
        {label}
      </p>
    </div>
  );
}

function Tile({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "win" | "challenge" | "flame" | "muted";
}) {
  const color =
    tone === "win"
      ? "text-win"
      : tone === "challenge"
        ? "text-challenge"
        : tone === "flame"
          ? "text-flame"
          : "text-ink-muted";
  const glow =
    tone === "flame" ? "glow-flame" : tone === "win" ? "glow-win" : "";

  return (
    <div className={`card p-4 ${glow}`}>
      <p className="eyebrow">{label}</p>
      <p className={`display tnum mt-1 text-4xl ${color}`}>{value}</p>
      <p className="mt-1 text-[11px] text-ink-faint">{detail}</p>
    </div>
  );
}

function BarList({
  rows,
  byId,
  tone,
}: {
  rows: { opponent: number; played: number; wins: number; winRate: number }[];
  byId: Map<number, Player>;
  tone: "win" | "challenge";
}) {
  const bar = tone === "win" ? "bg-win" : "bg-challenge";
  const text = tone === "win" ? "text-win" : "text-challenge";

  return (
    <ul className="card divide-y divide-line/60">
      {rows.map((row) => {
        const other = byId.get(row.opponent);
        if (!other) return null;
        return (
          <li key={row.opponent} className="px-3 py-3">
            <div className="flex items-center gap-3">
              <Avatar player={other} size="sm" />
              <span className="display min-w-0 flex-1 truncate text-sm text-ink">
                {other.shortName}
              </span>
              <span className={`display tnum text-sm ${text}`}>
                {formatPercent(row.winRate)}
              </span>
              <span className="display tnum w-14 text-right text-sm text-ink-faint">
                {row.wins}–{row.played - row.wins}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-input">
              <div
                className={`h-full ${bar}`}
                style={{ width: `${Math.round(row.winRate * 100)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
