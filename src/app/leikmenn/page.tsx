import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { AddPlayerInline } from "@/components/AddPlayerInline";
import { MeProvider } from "@/components/Me";
import { MeSwitcher } from "@/components/MeSwitcher";
import { EmptyState, SectionTitle, Shell } from "@/components/Shell";
import {
  formatPercent,
  rankedLeaderboard,
  seasonStats,
  winRateTone,
} from "@/lib/domain/stats";
import * as repo from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const [players, season] = await Promise.all([
    repo.getPlayers(),
    repo.getActiveSeason(),
  ]);

  const sessions = season ? await repo.getSessions(season.id) : [];
  const stats = seasonStats(
    sessions,
    players.map((p) => p.id),
  );
  const statsById = new Map(stats.players.map((s) => [s.playerId, s]));
  const ordered = rankedLeaderboard(stats.players);

  const regulars = ordered.filter((s) => !players.find((p) => p.id === s.playerId)?.isGuest);
  const guests = ordered.filter((s) => players.find((p) => p.id === s.playerId)?.isGuest);

  return (
    <Shell status={season?.name}>
      <MeProvider>
        <SectionTitle>Leikmenn</SectionTitle>

        {players.length === 0 ? (
          <EmptyState title="Enginn leikmaður skráður">
            Bættu við hópnum hér að neðan.
          </EmptyState>
        ) : (
          <ul className="space-y-2">
            {regulars.map((row) => (
              <PlayerRow
                key={row.playerId}
                player={players.find((p) => p.id === row.playerId)!}
                stats={statsById.get(row.playerId)}
              />
            ))}
          </ul>
        )}

        {guests.length > 0 ? (
          <>
            <SectionTitle>Gestir</SectionTitle>
            <ul className="space-y-2">
              {guests.map((row) => (
                <PlayerRow
                  key={row.playerId}
                  player={players.find((p) => p.id === row.playerId)!}
                  stats={statsById.get(row.playerId)}
                />
              ))}
            </ul>
          </>
        ) : null}

        <div className="mt-4">
          <AddPlayerInline />
        </div>

        <SectionTitle>Þetta tæki</SectionTitle>
        <MeSwitcher players={players} />
      </MeProvider>
    </Shell>
  );
}

function PlayerRow({
  player,
  stats,
}: {
  player: { id: number; name: string; shortName: string; initials: string };
  stats?: { played: number; wins: number; losses: number; winRate: number; honors: number };
}) {
  return (
    <li>
      <Link href={`/leikmenn/${player.id}`} className="card flex items-center gap-3 p-3">
        <Avatar player={player} />
        <div className="min-w-0 flex-1">
          <p className="display truncate text-base text-ink">{player.name}</p>
          <p className="text-[11px] text-ink-faint">
            {stats && stats.played > 0
              ? `${stats.wins}S – ${stats.losses}T${stats.honors > 0 ? ` · ${stats.honors}× 3 í röð` : ""}`
              : "Engir leikir á tímabilinu"}
          </p>
        </div>
        {stats && stats.played > 0 ? (
          <span
            className={`display tnum shrink-0 text-xl ${winRateTone(stats.winRate, stats.played)}`}
          >
            {formatPercent(stats.winRate)}
          </span>
        ) : null}
      </Link>
    </li>
  );
}
